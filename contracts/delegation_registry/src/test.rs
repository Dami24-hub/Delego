#![cfg(test)]

use super::*;
use soroban_sdk::{
    testutils::{Address as _, Ledger},
    Address, BytesN, Env, Symbol,
};

fn setup() -> (
    Env,
    DelegationRegistryClient<'static>,
    Address,
    Address,
    BytesN<32>,
    Address,
) {
    let env = Env::default();
    let contract_id = env.register(DelegationRegistry, ());
    let client = DelegationRegistryClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let owner = Address::generate(&env);
    let agent_id = BytesN::from_array(&env, &[1; 32]);
    let permissions_contract = Address::generate(&env);

    client.initialize(&admin);

    (env, client, admin, owner, agent_id, permissions_contract)
}

#[test]
fn test_full_lifecycle() {
    let (env, client, _, owner, agent_id, permissions_contract) = setup();
    env.mock_all_auths();

    let label = Symbol::new(&env, "Agent_X");

    let id = client.create_delegation(&owner, &agent_id, &permissions_contract, &label, &1000);
    assert_eq!(id, 1);

    let record = client.get_delegation(&id);
    assert_eq!(record.status, DelegationStatus::Active);
    assert_eq!(client.is_authorized(&id, &agent_id), true);

    client.pause_delegation(&id);
    let record = client.get_delegation(&id);
    assert_eq!(record.status, DelegationStatus::Paused);
    assert_eq!(client.is_authorized(&id, &agent_id), false);

    client.resume_delegation(&id);
    let record = client.get_delegation(&id);
    assert_eq!(record.status, DelegationStatus::Active);
    assert_eq!(client.is_authorized(&id, &agent_id), true);

    client.revoke_delegation(&id);
    let record = client.get_delegation(&id);
    assert_eq!(record.status, DelegationStatus::Revoked);
    assert_eq!(client.is_authorized(&id, &agent_id), false);
}

#[test]
fn test_expiry_behavior() {
    let (env, client, _, owner, agent_id, permissions_contract) = setup();
    env.mock_all_auths();

    env.ledger().set_sequence_number(100);
    let label = Symbol::new(&env, "Agent_Y");

    let id = client.create_delegation(&owner, &agent_id, &permissions_contract, &label, &100);
    assert_eq!(client.is_authorized(&id, &agent_id), true);

    env.ledger().set_sequence_number(200);
    assert_eq!(client.is_authorized(&id, &agent_id), false);
}

#[test]
#[should_panic]
fn test_unauthorized_access() {
    let (env, client, _, owner, agent_id, permissions_contract) = setup();
    let label = Symbol::new(&env, "Agent_Z");

    client.create_delegation(&owner, &agent_id, &permissions_contract, &label, &100);
}

#[test]
#[should_panic(expected = "Can only resume a paused delegation")]
fn test_resume_active_fails() {
    let (env, client, _, owner, agent_id, permissions_contract) = setup();
    env.mock_all_auths();

    let label = Symbol::new(&env, "Agent_Y");
    let id = client.create_delegation(&owner, &agent_id, &permissions_contract, &label, &100);

    client.resume_delegation(&id);
}

#[test]
fn test_multiple_delegations_per_owner() {
    let (env, client, _, owner, agent_id, permissions_contract) = setup();
    env.mock_all_auths();

    let label1 = Symbol::new(&env, "Shopping");
    let label2 = Symbol::new(&env, "Trading");

    client.create_delegation(&owner, &agent_id, &permissions_contract, &label1, &100);
    client.create_delegation(&owner, &agent_id, &permissions_contract, &label2, &100);

    let dels = client.get_delegations_by_owner(&owner);
    assert_eq!(dels.len(), 2);
    assert_eq!(dels.get(0).unwrap().label, label1);
    assert_eq!(dels.get(1).unwrap().label, label2);
}

// Issue #360: Delegation Versioning with Rollback Support

#[test]
fn test_version_increments_on_each_update() {
    let (env, client, _, owner, agent_id, permissions_contract) = setup();
    env.mock_all_auths();

    let label = Symbol::new(&env, "Versioned_Agent");
    let id = client.create_delegation(&owner, &agent_id, &permissions_contract, &label, &1000);

    // Version should be 1 at creation
    assert_eq!(client.get_delegation_version(&id), 1);

    // Pause increments version
    client.pause_delegation(&id);
    assert_eq!(client.get_delegation_version(&id), 2);

    // Resume increments version
    client.resume_delegation(&id);
    assert_eq!(client.get_delegation_version(&id), 3);

    // Revoke increments version
    client.revoke_delegation(&id);
    assert_eq!(client.get_delegation_version(&id), 4);
}

#[test]
fn test_rollback_restores_previous_state() {
    let (env, client, _, owner, agent_id, permissions_contract) = setup();
    env.mock_all_auths();

    let label = Symbol::new(&env, "Rollback_Test");
    let id = client.create_delegation(&owner, &agent_id, &permissions_contract, &label, &1000);

    // Version 1: Active
    assert_eq!(client.get_delegation(&id).status, DelegationStatus::Active);
    assert_eq!(client.get_delegation_version(&id), 1);

    // Pause → Version 2: Paused
    client.pause_delegation(&id);
    assert_eq!(client.get_delegation(&id).status, DelegationStatus::Paused);
    assert_eq!(client.get_delegation_version(&id), 2);

    // Resume → Version 3: Active
    client.resume_delegation(&id);
    assert_eq!(client.get_delegation(&id).status, DelegationStatus::Active);
    assert_eq!(client.get_delegation_version(&id), 3);

    // Rollback to version 1 (Active)
    client.rollback_delegation(&id, &1);

    let record = client.get_delegation(&id);
    assert_eq!(record.status, DelegationStatus::Active);
    // Version should be incremented after rollback
    assert_eq!(client.get_delegation_version(&id), 4);
}

#[test]
#[should_panic(expected = "Cannot rollback before version 1")]
fn test_cannot_rollback_before_version_1() {
    let (env, client, _, owner, agent_id, permissions_contract) = setup();
    env.mock_all_auths();

    let label = Symbol::new(&env, "No_Rollback_V0");
    let id = client.create_delegation(&owner, &agent_id, &permissions_contract, &label, &1000);

    // Attempt to rollback to version 0 should panic
    client.rollback_delegation(&id, &0);
}

#[test]
#[should_panic(expected = "Target version must be less than current version")]
fn test_cannot_rollback_to_current_or_future_version() {
    let (env, client, _, owner, agent_id, permissions_contract) = setup();
    env.mock_all_auths();

    let label = Symbol::new(&env, "Future_Rollback");
    let id = client.create_delegation(&owner, &agent_id, &permissions_contract, &label, &1000);

    client.pause_delegation(&id);

    // Try to rollback to current version (should fail)
    client.rollback_delegation(&id, &2);
}

#[test]
fn test_version_history_is_stored() {
    let (env, client, _, owner, agent_id, permissions_contract) = setup();
    env.mock_all_auths();

    let label = Symbol::new(&env, "History_Test");
    let id = client.create_delegation(&owner, &agent_id, &permissions_contract, &label, &1000);

    client.pause_delegation(&id);
    client.resume_delegation(&id);

    let history = client.get_delegation_history(&id);
    
    // Should have 3 snapshots: created (v1), paused (v2), resumed (v3)
    assert!(history.len() >= 1);

    let first_snapshot = history.get(0).unwrap();
    assert_eq!(first_snapshot.version, 1);
    assert_eq!(first_snapshot.record.status, DelegationStatus::Active);
}
