"use client";

import { Button, Card } from "@delegolabs/ui";

export interface PauseResumeConfirmModalProps {
  isOpen: boolean;
  action: "pause" | "resume";
  agentId: string;
  onConfirm: () => void | Promise<unknown>;
  onCancel: () => void;
  loading?: boolean;
}

export function PauseResumeConfirmModal({
  isOpen,
  action,
  agentId,
  onConfirm,
  onCancel,
  loading = false,
}: PauseResumeConfirmModalProps) {
  if (!isOpen) return null;

  const isPause = action === "pause";
  const title = isPause ? `Pause Delegation for ${agentId}?` : `Resume Delegation for ${agentId}?`;

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pause-resume-modal-title"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "1rem",
      }}
    >
      <div style={{ maxWidth: "480px", width: "100%" }}>
        <Card title={title} ariaLabel={title}>
          <div style={{ margin: "1rem 0" }}>
            {isPause ? (
              <>
                <p style={{ color: "var(--color-text-main, #374151)", fontSize: "0.9375rem" }}>
                  Pausing this delegation temporarily stops the agent from making new spending requests or executing orders on your behalf.
                </p>
                <div
                  style={{
                    padding: "0.75rem",
                    borderRadius: "0.375rem",
                    backgroundColor: "var(--color-info-subtle, #eff6ff)",
                    border: "1px solid var(--color-info, #3b82f6)",
                    fontSize: "0.84375rem",
                    color: "#1e40af",
                    marginTop: "0.75rem",
                  }}
                >
                  ℹ️ <strong>Paused Semantics:</strong> No new spends can be initiated. Any pending manual approvals remain decidable.
                </div>
              </>
            ) : (
              <p style={{ color: "var(--color-text-main, #374151)", fontSize: "0.9375rem" }}>
                Resuming will allow the agent to start creating orders again within its configured spending limits.
              </p>
            )}
          </div>

          <div className="form-actions" style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "1.5rem" }}>
            <Button variant="ghost" onClick={onCancel} disabled={loading}>
              Cancel
            </Button>
            <Button
              variant={isPause ? "secondary" : "primary"}
              onClick={onConfirm}
              disabled={loading}
            >
              {loading ? "Updating…" : isPause ? "Pause Delegation" : "Resume Delegation"}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
