"use client";

import { Card, Button } from "@delegolabs/ui";
import {
  type QueuedMutation,
  removeMutation,
  updateMutationStatus,
} from "../../lib/offlineQueue";
import { replayOfflineQueue } from "../../lib/replayEngine";

export interface ConflictResolutionCardProps {
  mutation: QueuedMutation;
  onResolved?: () => void;
}

/**
 * Resolution card surfaced when an offline mutation encounters an HTTP 409 Conflict
 * on replay (#618). Never auto-forces changes — requires explicit user action.
 */
export function ConflictResolutionCard({
  mutation,
  onResolved,
}: ConflictResolutionCardProps) {
  const handleForceOverwrite = async () => {
    // Reset status to pending so replay engine re-attempts
    await updateMutationStatus(mutation.id, "pending");
    await replayOfflineQueue();
    if (onResolved) onResolved();
  };

  const handleDiscard = async () => {
    await removeMutation(mutation.id);
    if (onResolved) onResolved();
  };

  const actionLabel =
    mutation.mutationClass === "approve_order"
      ? "Approve Order"
      : mutation.mutationClass === "reject_order"
        ? "Reject Order"
        : mutation.mutationClass === "update_delegation"
          ? "Update Delegation"
          : "Revoke Delegation";

  return (
    <Card
      title="Conflict detected"
      ariaLabel="Conflict resolution"
      style={{
        borderColor: "var(--color-warning-border, #fde68a)",
        background: "var(--color-warning-bg, #fffbeb)",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <p
          style={{
            margin: 0,
            fontWeight: 600,
            color: "var(--color-warning-text, #92400e)",
          }}
        >
          State changed while offline — review needed
        </p>
        <p
          style={{
            margin: 0,
            fontSize: "0.875rem",
            color: "var(--color-text-secondary)",
          }}
        >
          You performed <strong>&ldquo;{actionLabel}&rdquo;</strong> on item{" "}
          <code>{mutation.resourceId}</code> while offline, but its state
          changed on the server before reconnection.
        </p>

        {mutation.errorMessage && (
          <p
            style={{
              margin: 0,
              fontSize: "0.8125rem",
              color: "var(--color-text-muted)",
              fontStyle: "italic",
            }}
          >
            Details: {mutation.errorMessage}
          </p>
        )}

        <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
          <Button onClick={handleForceOverwrite}>Retry my decision</Button>
          <Button variant="secondary" onClick={handleDiscard}>
            Discard my offline change
          </Button>
        </div>
      </div>
    </Card>
  );
}
