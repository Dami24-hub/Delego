"use client";

import { useState } from "react";
import { Button } from "@delegolabs/ui";
import { useDelegations } from "../../hooks/useDelegations";
import { useWallet } from "../../hooks/useWallet";
import { DelegationForm } from "../../components/delegations/DelegationForm";
import { DelegationList } from "../../components/delegations/DelegationList";
import { NotificationPermissionPrompt } from "../../components/notifications/NotificationPermissionPrompt";

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
  const [showNotifyPrompt, setShowNotifyPrompt] = useState(false);

  const handleCreate = async (input: Parameters<typeof createDelegation>[0]) => {
    const wasFirstDelegation = delegations.length === 0;
    const created = await createDelegation(input);
    if (created) {
      setShowForm(false);
      if (wasFirstDelegation) setShowNotifyPrompt(true);
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

      {showNotifyPrompt && (
        <NotificationPermissionPrompt message="Get notified about approvals for this delegation, even when this tab isn't in focus." />
      )}

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
