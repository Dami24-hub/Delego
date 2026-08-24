"use client";

import { useEffect, useState } from "react";
import { Button } from "@delegolabs/ui";
import { useDelegations } from "../../hooks/useDelegations";
import { useWallet } from "../../hooks/useWallet";
import { DelegationForm } from "../../components/delegations/DelegationForm";
import { DelegationList } from "../../components/delegations/DelegationList";
import { OPEN_DELEGATION_FORM_KEY } from "../../lib/delegationFormIntent";

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
  const [showForm, setShowForm] = useState(false);

  // Opened via the command palette's "New delegation" quick action.
  useEffect(() => {
    try {
      if (window.sessionStorage.getItem(OPEN_DELEGATION_FORM_KEY)) {
        window.sessionStorage.removeItem(OPEN_DELEGATION_FORM_KEY);
        setShowForm(true);
      }
    } catch {
      // sessionStorage may be unavailable (private mode) — just skip auto-open.
    }
  }, []);

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
        <Button variant="primary" onClick={() => setShowForm((v) => !v)}>
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
