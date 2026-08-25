"use client";

import { useEffect, useState } from "react";
import { Button } from "@delegolabs/ui";
import { useDelegations } from "../../hooks/useDelegations";
import { useWallet } from "../../hooks/useWallet";
import { DelegationForm } from "../../components/delegations/DelegationForm";
import { DelegationList } from "../../components/delegations/DelegationList";
import { NotificationPermissionPrompt } from "../../components/notifications/NotificationPermissionPrompt";
import { OPEN_DELEGATION_FORM_KEY } from "../../lib/delegationFormIntent";

import type { Delegation } from "@delegolabs/types";

/** Delegation management page — create, view, edit, pause/resume, duplicate, and revoke delegations. */
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
  const [duplicateSource, setDuplicateSource] = useState<Delegation | null>(null);
  const [showNotifyPrompt, setShowNotifyPrompt] = useState(false);

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
    const wasFirstDelegation = delegations.length === 0;
    const created = await createDelegation(input);
    if (created) {
      setShowForm(false);
      setDuplicateSource(null);
      if (wasFirstDelegation) setShowNotifyPrompt(true);
    }
  };

  const handleStartDuplicate = (delegation: Delegation) => {
    setDuplicateSource(delegation);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
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
          onClick={() => {
            if (showForm) {
              setShowForm(false);
              setDuplicateSource(null);
            } else {
              setDuplicateSource(null);
              setShowForm(true);
            }
          }}
        >
          {showForm ? "Close" : "New delegation"}
        </Button>
      </div>

      {showNotifyPrompt && (
        <NotificationPermissionPrompt message="Get notified about approvals for this delegation, even when this tab isn't in focus." />
      )}

      {showForm && (
        <DelegationForm
          defaultWalletId={address ?? ""}
          initialDelegation={duplicateSource ?? undefined}
          onSubmit={handleCreate}
          onCancel={() => {
            setShowForm(false);
            setDuplicateSource(null);
          }}
        />
      )}

      <DelegationList
        delegations={delegations}
        loading={loading}
        pendingIds={pendingIds}
        onUpdate={updateDelegation}
        onRevoke={revokeDelegation}
        onDuplicate={handleStartDuplicate}
      />
    </div>
  );
}
