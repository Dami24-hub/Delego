#![no_std]
use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, symbol_short, Address, BytesN, Env,
    Symbol, Vec,
};

// ── Error type ───────────────────────────────────────────────────────────────

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum DelegationError {
    /// Contract already initialized
    AlreadyInitialized = 1,
    /// Delegation record not found
    NotFound = 2,
    /// Caller is not authorized
    Unauthorized = 3,
    /// Can only pause an active delegation
    NotActive = 4,
    /// Can only resume a paused delegation
    NotPaused = 5,
    /// Delegation has already expired
    Expired = 6,
    /// Target rollback version must be ≥ 1
    InvalidVersion = 7,
    /// Target version must be less than the current version
    VersionNotLower = 8,
    /// Snapshot for the requested version was not found
    SnapshotNotFound = 9,
}

// ── Domain types ─────────────────────────────────────────────────────────────

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum DelegationStatus {
    Pending,
    Active,
    Paused,
    Revoked,
    Expired,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct DelegationRecord {
    pub id: u64,
    pub owner: Address,
    pub agent_id: BytesN<32>,
    pub permissions_contract: Address,
    pub status: DelegationStatus,
    pub label: Symbol,
    pub created_at: u64,
    pub expires_at_ledger: u32,
    pub version: u32,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct DelegationSnapshot {
    pub version: u32,
    pub snapshot_ledger: u32,
    pub record: DelegationRecord,
}

// ── Events ────────────────────────────────────────────────────────────────────

/// Emitted when a new delegation is created.
#[contracttype]
#[derive(Clone, Debug)]
pub struct DelegationCreatedEvent {
    pub delegation_id: u64,
    pub owner: Address,
    pub agent: BytesN<32>,
    pub timestamp: u64,
}

/// Emitted when a delegation is paused.
#[contracttype]
#[derive(Clone, Debug)]
pub struct DelegationPausedEvent {
    pub delegation_id: u64,
    pub owner: Address,
    pub agent: BytesN<32>,
    pub timestamp: u64,
}

/// Emitted when a delegation is resumed.
#[contracttype]
#[derive(Clone, Debug)]
pub struct DelegationResumedEvent {
    pub delegation_id: u64,
    pub owner: Address,
    pub agent: BytesN<32>,
    pub timestamp: u64,
}

/// Emitted when a delegation is revoked.
#[contracttype]
#[derive(Clone, Debug)]
pub struct DelegationRevokedEvent {
    pub delegation_id: u64,
    pub owner: Address,
    pub agent: BytesN<32>,
    pub timestamp: u64,
}

/// Emitted when a delegation transitions to Expired status.
#[contracttype]
#[derive(Clone, Debug)]
pub struct DelegationExpiredEvent {
    pub delegation_id: u64,
    pub owner: Address,
    pub agent: BytesN<32>,
    pub timestamp: u64,
}

// ── Storage keys ──────────────────────────────────────────────────────────────

#[contracttype]
pub enum DataKey {
    Admin,
    NextId,
    Delegation(u64),
    UserDelegations(Address),
    DelegationVersion(u64),
    DelegationHistory(u64),
}

// ── Contract ──────────────────────────────────────────────────────────────────

#[contract]
pub struct DelegationRegistry;

#[contractimpl]
impl DelegationRegistry {
    pub fn initialize(env: Env, admin: Address) -> Result<bool, DelegationError> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(DelegationError::AlreadyInitialized);
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::NextId, &1u64);
        Ok(true)
    }

    pub fn create_delegation(
        env: Env,
        owner: Address,
        agent_id: BytesN<32>,
        permissions_contract: Address,
        label: Symbol,
        ttl_ledgers: u32,
    ) -> u64 {
        owner.require_auth();

        let id = env
            .storage()
            .instance()
            .get(&DataKey::NextId)
            .unwrap_or(1u64);
        env.storage().instance().set(&DataKey::NextId, &(id + 1));

        let expires_at_ledger = env.ledger().sequence() + ttl_ledgers;
        let now = env.ledger().timestamp();

        let record = DelegationRecord {
            id,
            owner: owner.clone(),
            agent_id: agent_id.clone(),
            permissions_contract,
            status: DelegationStatus::Active,
            label,
            created_at: now,
            expires_at_ledger,
            version: 1,
        };

        env.storage()
            .persistent()
            .set(&DataKey::Delegation(id), &record);

        // Initialize version tracking
        env.storage()
            .persistent()
            .set(&DataKey::DelegationVersion(id), &1u32);

        // Store snapshot for version 1
        let snapshot = DelegationSnapshot {
            version: 1,
            snapshot_ledger: env.ledger().sequence(),
            record: record.clone(),
        };

        let mut history = env
            .storage()
            .persistent()
            .get::<_, Vec<DelegationSnapshot>>(&DataKey::DelegationHistory(id))
            .unwrap_or(Vec::new(&env));

        history.push_back(snapshot);
        env.storage()
            .persistent()
            .set(&DataKey::DelegationHistory(id), &history);

        let mut user_dels = env
            .storage()
            .persistent()
            .get::<_, Vec<u64>>(&DataKey::UserDelegations(owner.clone()))
            .unwrap_or(Vec::new(&env));

        user_dels.push_back(id);
        env.storage()
            .persistent()
            .set(&DataKey::UserDelegations(owner.clone()), &user_dels);

        env.events().publish(
            (symbol_short!("deleg"), symbol_short!("created")),
            DelegationCreatedEvent {
                delegation_id: id,
                owner,
                agent: agent_id,
                timestamp: now,
            },
        );

        id
    }

    pub fn pause_delegation(
        env: Env,
        delegation_id: u64,
    ) -> Result<bool, DelegationError> {
        let mut record: DelegationRecord = env
            .storage()
            .persistent()
            .get(&DataKey::Delegation(delegation_id))
            .ok_or(DelegationError::NotFound)?;

        record.owner.require_auth();

        if record.status != DelegationStatus::Active {
            return Err(DelegationError::NotActive);
        }

        record.status = DelegationStatus::Paused;
        record.version = Self::increment_version(&env, delegation_id);

        env.storage()
            .persistent()
            .set(&DataKey::Delegation(delegation_id), &record);

        Self::store_snapshot(&env, delegation_id, &record);

        env.events().publish(
            (symbol_short!("deleg"), symbol_short!("paused")),
            DelegationPausedEvent {
                delegation_id,
                owner: record.owner.clone(),
                agent: record.agent_id.clone(),
                timestamp: env.ledger().timestamp(),
            },
        );

        Ok(true)
    }

    pub fn resume_delegation(
        env: Env,
        delegation_id: u64,
    ) -> Result<bool, DelegationError> {
        let mut record: DelegationRecord = env
            .storage()
            .persistent()
            .get(&DataKey::Delegation(delegation_id))
            .ok_or(DelegationError::NotFound)?;

        record.owner.require_auth();

        if record.status != DelegationStatus::Paused {
            return Err(DelegationError::NotPaused);
        }

        if env.ledger().sequence() >= record.expires_at_ledger {
            record.status = DelegationStatus::Expired;
            record.version = Self::increment_version(&env, delegation_id);
            env.storage()
                .persistent()
                .set(&DataKey::Delegation(delegation_id), &record);
            Self::store_snapshot(&env, delegation_id, &record);

            env.events().publish(
                (symbol_short!("deleg"), symbol_short!("expired")),
                DelegationExpiredEvent {
                    delegation_id,
                    owner: record.owner.clone(),
                    agent: record.agent_id.clone(),
                    timestamp: env.ledger().timestamp(),
                },
            );

            return Err(DelegationError::Expired);
        }

        record.status = DelegationStatus::Active;
        record.version = Self::increment_version(&env, delegation_id);

        env.storage()
            .persistent()
            .set(&DataKey::Delegation(delegation_id), &record);

        Self::store_snapshot(&env, delegation_id, &record);

        env.events().publish(
            (symbol_short!("deleg"), symbol_short!("resumed")),
            DelegationResumedEvent {
                delegation_id,
                owner: record.owner.clone(),
                agent: record.agent_id.clone(),
                timestamp: env.ledger().timestamp(),
            },
        );

        Ok(true)
    }

    pub fn revoke_delegation(
        env: Env,
        delegation_id: u64,
    ) -> Result<bool, DelegationError> {
        let mut record: DelegationRecord = env
            .storage()
            .persistent()
            .get(&DataKey::Delegation(delegation_id))
            .ok_or(DelegationError::NotFound)?;

        record.owner.require_auth();

        if record.status == DelegationStatus::Revoked {
            return Ok(true);
        }

        record.status = DelegationStatus::Revoked;
        record.version = Self::increment_version(&env, delegation_id);

        env.storage()
            .persistent()
            .set(&DataKey::Delegation(delegation_id), &record);

        Self::store_snapshot(&env, delegation_id, &record);

        env.events().publish(
            (symbol_short!("deleg"), symbol_short!("revoked")),
            DelegationRevokedEvent {
                delegation_id,
                owner: record.owner.clone(),
                agent: record.agent_id.clone(),
                timestamp: env.ledger().timestamp(),
            },
        );

        Ok(true)
    }

    pub fn rollback_delegation(
        env: Env,
        delegation_id: u64,
        target_version: u32,
    ) -> Result<bool, DelegationError> {
        let mut record: DelegationRecord = env
            .storage()
            .persistent()
            .get(&DataKey::Delegation(delegation_id))
            .ok_or(DelegationError::NotFound)?;

        record.owner.require_auth();

        if target_version < 1 {
            return Err(DelegationError::InvalidVersion);
        }

        let current_version: u32 = env
            .storage()
            .persistent()
            .get(&DataKey::DelegationVersion(delegation_id))
            .unwrap_or(1);

        if target_version >= current_version {
            return Err(DelegationError::VersionNotLower);
        }

        let history: Vec<DelegationSnapshot> = env
            .storage()
            .persistent()
            .get(&DataKey::DelegationHistory(delegation_id))
            .unwrap_or(Vec::new(&env));

        let mut target_snapshot: Option<DelegationSnapshot> = None;
        for snapshot in history.iter() {
            if snapshot.version == target_version {
                target_snapshot = Some(snapshot);
                break;
            }
        }

        let snapshot = target_snapshot.ok_or(DelegationError::SnapshotNotFound)?;

        record = snapshot.record;
        record.version = Self::increment_version(&env, delegation_id);

        env.storage()
            .persistent()
            .set(&DataKey::Delegation(delegation_id), &record);

        Self::store_snapshot(&env, delegation_id, &record);

        Ok(true)
    }

    pub fn get_delegation(env: Env, delegation_id: u64) -> Result<DelegationRecord, DelegationError> {
        env.storage()
            .persistent()
            .get(&DataKey::Delegation(delegation_id))
            .ok_or(DelegationError::NotFound)
    }

    pub fn get_delegation_version(env: Env, delegation_id: u64) -> u32 {
        env.storage()
            .persistent()
            .get(&DataKey::DelegationVersion(delegation_id))
            .unwrap_or(1)
    }

    pub fn get_delegation_history(env: Env, delegation_id: u64) -> Vec<DelegationSnapshot> {
        env.storage()
            .persistent()
            .get(&DataKey::DelegationHistory(delegation_id))
            .unwrap_or(Vec::new(&env))
    }

    pub fn get_delegations_by_owner(env: Env, owner: Address) -> Vec<DelegationRecord> {
        let user_dels = env
            .storage()
            .persistent()
            .get::<_, Vec<u64>>(&DataKey::UserDelegations(owner))
            .unwrap_or(Vec::new(&env));

        let mut records = Vec::new(&env);
        for id in user_dels.iter() {
            if let Some(record) = env
                .storage()
                .persistent()
                .get::<_, DelegationRecord>(&DataKey::Delegation(id))
            {
                records.push_back(record);
            }
        }
        records
    }

    pub fn is_authorized(env: Env, delegation_id: u64, agent_id: BytesN<32>) -> bool {
        let record: DelegationRecord = match env
            .storage()
            .persistent()
            .get(&DataKey::Delegation(delegation_id))
        {
            Some(r) => r,
            None => return false,
        };

        if record.status != DelegationStatus::Active {
            return false;
        }

        if env.ledger().sequence() >= record.expires_at_ledger {
            return false;
        }

        if record.agent_id != agent_id {
            return false;
        }

        true
    }

    // ── Internal helpers ─────────────────────────────────────────────────────

    fn increment_version(env: &Env, delegation_id: u64) -> u32 {
        let current: u32 = env
            .storage()
            .persistent()
            .get(&DataKey::DelegationVersion(delegation_id))
            .unwrap_or(1);
        let next = current + 1;
        env.storage()
            .persistent()
            .set(&DataKey::DelegationVersion(delegation_id), &next);
        next
    }

    fn store_snapshot(env: &Env, delegation_id: u64, record: &DelegationRecord) {
        let snapshot = DelegationSnapshot {
            version: record.version,
            snapshot_ledger: env.ledger().sequence(),
            record: record.clone(),
        };

        let mut history = env
            .storage()
            .persistent()
            .get::<_, Vec<DelegationSnapshot>>(&DataKey::DelegationHistory(delegation_id))
            .unwrap_or(Vec::new(env));

        history.push_back(snapshot);
        env.storage()
            .persistent()
            .set(&DataKey::DelegationHistory(delegation_id), &history);
    }
}

#[cfg(test)]
mod test;
