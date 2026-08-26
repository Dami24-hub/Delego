"use client";

import { useState } from "react";
import Link from "next/link";
import { Amount, Button, Card, StroopsInput } from "@delegolabs/ui";
import type { Delegation, UpdateDelegationInput } from "@delegolabs/types";
import { DelegationQR } from "./DelegationQR";
import { LimitUsageBar } from "./LimitUsageBar";
import { PauseResumeConfirmModal } from "./PauseResumeConfirmModal";
import { MerchantWhitelistPicker } from "./MerchantWhitelistPicker";
import { useCurrency } from "../../hooks/useCurrency";

export interface DelegationCardProps {
  delegation: Delegation;
  /** True while an optimistic create/update/revoke is in flight for this delegation */
  pending?: boolean;
  onUpdate: (id: string, input: UpdateDelegationInput) => void | Promise<unknown>;
  onRevoke: (id: string) => void | Promise<unknown>;
  onDuplicate?: (delegation: Delegation) => void;
}

/** Single delegation card with pause/resume, inline policy editing, revoke, duplicate, and QR sharing. */
export function DelegationCard({
  delegation,
  pending = false,
  onUpdate,
  onRevoke,
  onDuplicate,
}: DelegationCardProps) {
  const [editing, setEditing] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);

  const [maxPerTransaction, setMaxPerTransaction] = useState(
    delegation.policy.maxPerTransaction
  );

  const [maxTotal, setMaxTotal] = useState(delegation.policy.maxTotal);

  const [allowedMerchants, setAllowedMerchants] = useState<string[]>(
    delegation.policy.allowedMerchants
  );

  const [unrestrictedMerchants, setUnrestrictedMerchants] = useState(
    delegation.policy.allowedMerchants.length === 0
  );

  const [showEmptyWhitelistError, setShowEmptyWhitelistError] = useState(false);
  const [saving, setSaving] = useState(false);

  const { currencyId, rate } = useCurrency();

  const isPaused = delegation.status === "paused";
  const isRevoked = delegation.status === "revoked";
  const isExpired = delegation.status === "expired";
  const isTerminal = isRevoked || isExpired;
  const isPending = pending || delegation.id.startsWith("temp-");

  const handleConfirmPauseToggle = async () => {
    setModalLoading(true);

    try {
      const nextStatus = isPaused ? "active" : "paused";

      await onUpdate(delegation.id, {
        status: nextStatus,
      });

      setShowPauseModal(false);
    } finally {
      setModalLoading(false);
    }
  };

  const handleRevoke = () => {
    if (
      window.confirm(
        `Revoke delegation "${delegation.agentId}"? This cannot be undone.`
      )
    ) {
      onRevoke(delegation.id);
    }
  };

  const handleSavePolicy = async () => {
    if (!unrestrictedMerchants && allowedMerchants.length === 0) {
      setShowEmptyWhitelistError(true);
      return;
    }

    setShowEmptyWhitelistError(false);
    setSaving(true);

    try {
      await onUpdate(delegation.id, {
        policy: {
          maxPerTransaction: maxPerTransaction.toString(),
          maxTotal: maxTotal.toString(),
          allowedMerchants: unrestrictedMerchants ? [] : allowedMerchants,
        },
      });

      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Card
        title={delegation.label || delegation.agentId}
        ariaLabel={`Delegation for agent ${delegation.agentId}`}
        style={{
          opacity: isPending ? 0.6 : isPaused ? 0.8 : 1,
          borderColor: isPaused
            ? "var(--color-border-paused, #d1d5db)"
            : undefined,
          backgroundColor: isPaused
            ? "var(--color-bg-paused, #f9fafb)"
            : undefined,
          transition:
            "opacity 0.15s ease-in-out, border-color 0.15s ease-in-out",
        }}
      >
        <div
          className="delegation-card-header"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <span className={`status-badge status-${delegation.status}`}>
              {delegation.status}
            </span>

            {isPaused && (
              <span
                style={{
                  marginLeft: "0.5rem",
                  fontSize: "0.75rem",
                  color: "#6b7280",
                  fontStyle: "italic",
                }}
              >
                (Spends blocked)
              </span>
            )}
          </div>

          <Link
            href={`/delegations/${delegation.id}`}
            style={{
              fontSize: "0.8125rem",
              color: "var(--color-primary, #2563eb)",
              fontWeight: 500,
            }}
          >
            View detail →
          </Link>

          {isPending && (
            <span className="delegation-pending-hint">Saving…</span>
          )}
        </div>

        {!editing ? (
          <>
            <dl
              className="wallet-detail-list"
              style={{ marginTop: "0.5rem" }}
            >
              <div className="wallet-detail-row">
                <dt>Max / transaction</dt>
                <dd>
                  <Amount
                    stroops={delegation.policy.maxPerTransaction}
                    currency={currencyId}
                    xlmUsdRate={rate?.xlmUsdRate}
                  />
                </dd>
              </div>

              <div className="wallet-detail-row">
                <dt>Total limit</dt>
                <dd>
                  <Amount
                    stroops={delegation.policy.maxTotal}
                    currency={currencyId}
                    xlmUsdRate={rate?.xlmUsdRate}
                  />
                </dd>
              </div>

              <div className="wallet-detail-row">
                <dt>Merchants</dt>
                <dd>
                  {delegation.policy.allowedMerchants.length > 0
                    ? delegation.policy.allowedMerchants.join(", ")
                    : "All merchants"}
                </dd>
              </div>

              <div className="wallet-detail-row">
                <dt>Expires</dt>
                <dd>{delegation.policy.expiresAt ?? "Never"}</dd>
              </div>
            </dl>

            <LimitUsageBar
              spent={0n}
              cap={delegation.policy.maxTotal}
              periodRollover={delegation.policy.expiresAt}
              density="compact"
            />
          </>
        ) : (
          <div className="settings-section">
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.875rem",
                  marginBottom: "0.25rem",
                }}
              >
                Max per transaction
              </label>

              <StroopsInput
                value={maxPerTransaction}
                onChange={setMaxPerTransaction}
                style={{ width: "100%" }}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.875rem",
                  marginBottom: "0.25rem",
                }}
              >
                Max total
              </label>

              <StroopsInput
                value={maxTotal}
                onChange={setMaxTotal}
                style={{ width: "100%" }}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.875rem",
                  marginBottom: "0.25rem",
                }}
              >
                Allowed merchants
              </label>

              <MerchantWhitelistPicker
                value={allowedMerchants}
                onChange={setAllowedMerchants}
                unrestricted={unrestrictedMerchants}
                onUnrestrictedChange={(next) => {
                  setUnrestrictedMerchants(next);

                  if (next) {
                    setShowEmptyWhitelistError(false);
                  }
                }}
                showEmptyWhitelistError={showEmptyWhitelistError}
              />
            </div>
          </div>
        )}

        <div className="form-actions delegation-actions">
          {!isTerminal && !editing && (
            <>
              <Button
                variant="secondary"
                onClick={() => setShowPauseModal(true)}
                disabled={isPending}
              >
                {isPaused ? "Resume" : "Pause"}
              </Button>

              {onDuplicate && (
                <Button
                  variant="secondary"
                  onClick={() => onDuplicate(delegation)}
                  disabled={isPending}
                >
                  Duplicate
                </Button>
              )}

              <Button
                variant="secondary"
                onClick={() => setEditing(true)}
                disabled={isPending}
              >
                Edit
              </Button>

              <Button
                variant="ghost"
                onClick={() => setShowQr((v) => !v)}
              >
                {showQr ? "Hide QR" : "Share QR"}
              </Button>

              <Button
                variant="ghost"
                onClick={handleRevoke}
                disabled={isPending}
              >
                Revoke
              </Button>
            </>
          )}

          {editing && (
            <>
              <Button
                variant="primary"
                onClick={handleSavePolicy}
                disabled={saving}
              >
                {saving ? "Saving…" : "Save"}
              </Button>

              <Button
                variant="ghost"
                onClick={() => setEditing(false)}
                disabled={saving}
              >
                Cancel
              </Button>
            </>
          )}
        </div>

        {showQr && !editing && (
          <DelegationQR
            delegationId={delegation.id}
            userId={delegation.userId}
            agentId={delegation.agentId}
          />
        )}
      </Card>

      <PauseResumeConfirmModal
        isOpen={showPauseModal}
        action={isPaused ? "resume" : "pause"}
        agentId={delegation.agentId}
        onConfirm={handleConfirmPauseToggle}
        onCancel={() => setShowPauseModal(false)}
        loading={modalLoading}
      />
    </>
  );
}