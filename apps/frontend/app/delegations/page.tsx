"use client";

import { useState } from "react";
import { Button } from "@delegolabs/ui";
import { useDelegations } from "../../hooks/useDelegations";
import { useWallet } from "../../hooks/useWallet";
import { useNetworkMismatch } from "../../hooks/useNetworkMismatch";
import { DelegationForm } from "../../components/delegations/DelegationForm";
import { DelegationList } from "../../components/delegations/DelegationList";

/** Delegation management page — create, view, edit, pause/resume, and revoke delegations. */
export default function DelegationsPage() {
  const {
    delegations,
    loading,
    error,
    pendingIds,
    createDelegation,
    updateDelegation,
    revokeDelegation,
  } = useDelegations();
  const { address } = useWallet();
  const { isMismatched } = useNetworkMismatch();
  const [showForm, setShowForm] = useState(false);

  const handleCreate = async (input: Parameters<typeof createDelegation>[0]) => {
    const created = await createDelegation(input);
    if (created) {
      setShowForm(false);
    }
  };

  return (
    <div className="settings-page">
      <header className="header">
        <h1>Delegations</h1>
        <p>Grant, adjust, and revoke scoped spending authority for AI agents</p>
      </header>

      {error && (
        <div className="settings-status error" role="alert">
          {error}
        </div>
      )}

      <div className="form-actions">
        <Button
          variant="primary"
          onClick={() => setShowForm((v) => !v)}
          disabled={isMismatched && !showForm}
          title={
            isMismatched
              ? "Cannot create delegation while wallet and app network are mismatched"
              : undefined
          }
        >
          {showForm ? "Close" : "New delegation"}
        </Button>
      </div>

      {showForm && (
        <DelegationForm
          defaultWalletId={address ?? ""}
          onSubmit={handleCreate}
          onCancel={() => setShowForm(false)}
        />
      )}

      <DelegationList
        delegations={delegations}
        loading={loading}
        pendingIds={pendingIds}
        onUpdate={updateDelegation}
        onRevoke={revokeDelegation}
      />
    </div>
  );
}
