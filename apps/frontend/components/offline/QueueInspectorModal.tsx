"use client";

import { useEffect, useState } from "react";
import { Card, Button, Badge } from "@delegolabs/ui";
import {
  type QueuedMutation,
  subscribeToQueue,
  clearQueue,
  removeMutation,
  updateMutationStatus,
} from "../../lib/offlineQueue";
import { replayOfflineQueue } from "../../lib/replayEngine";

export function QueueInspectorModal() {
  const [queue, setQueue] = useState<QueuedMutation[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check if ?debug=queue flag is present in URL
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("debug") === "queue" || params.has("debug_queue")) {
        setIsOpen(true);
      }
    }
    return subscribeToQueue(setQueue);
  }, []);

  if (!isOpen) return null;

  const handleManualReplay = async () => {
    await replayOfflineQueue();
  };

  const handleClearAll = async () => {
    await clearQueue();
  };

  return (
    <div
      style={{
        position: "fixed",
        bottom: "1rem",
        right: "1rem",
        width: "360px",
        maxHeight: "500px",
        overflowY: "auto",
        zIndex: 9999,
        boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
      }}
    >
      <Card title="Offline Queue Inspector (Debug)" ariaLabel="Offline queue inspector">
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
              Total items: {queue.length}
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1rem" }}
            >
              ✕
            </button>
          </div>

          <div style={{ display: "flex", gap: "0.5rem" }}>
            <Button variant="secondary" onClick={handleManualReplay}>
              Replay now
            </Button>
            <Button variant="ghost" onClick={handleClearAll}>
              Clear debug queue
            </Button>
          </div>

          {queue.length === 0 ? (
            <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", margin: 0 }}>
              Queue is empty.
            </p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {queue.map((item) => (
                <li
                  key={item.id}
                  style={{
                    padding: "0.5rem",
                    borderRadius: "0.25rem",
                    background: "var(--color-bg-subtle)",
                    fontSize: "0.75rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.25rem",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: 600 }}>{item.mutationClass}</span>
                    <Badge
                      tone={
                        item.status === "pending"
                          ? "info"
                          : item.status === "conflict"
                          ? "warning"
                          : item.status === "quarantined"
                          ? "error"
                          : "success"
                      }
                    >
                      {item.status}
                    </Badge>
                  </div>

                  <div>
                    <strong>Resource:</strong> {item.resourceId}
                  </div>
                  <div>
                    <strong>Idempotency Key:</strong> {item.idempotencyKey.slice(0, 8)}…
                  </div>

                  {item.errorMessage && (
                    <div style={{ color: "var(--color-error-text)" }}>
                      <strong>Error:</strong> {item.errorMessage}
                    </div>
                  )}

                  <div style={{ display: "flex", gap: "0.25rem", marginTop: "0.25rem" }}>
                    <button
                      type="button"
                      onClick={() => removeMutation(item.id)}
                      style={{ fontSize: "0.6875rem", color: "var(--color-error-text)", background: "none", border: "none", cursor: "pointer" }}
                    >
                      Remove
                    </button>
                    {item.status === "pending" && (
                      <button
                        type="button"
                        onClick={() => updateMutationStatus(item.id, "quarantined", { errorMessage: "Manual quarantine via debug view" })}
                        style={{ fontSize: "0.6875rem", color: "var(--color-text-muted)", background: "none", border: "none", cursor: "pointer" }}
                      >
                        Quarantine
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>
    </div>
  );
}
