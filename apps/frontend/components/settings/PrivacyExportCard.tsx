"use client";

import { Card, Button } from "@delegolabs/ui";
import type { User, UserPreferences } from "@delegolabs/types";
import { useAccountExport } from "../../hooks/useAccountExport";

export interface PrivacyExportCardProps {
  user: User;
  preferences: UserPreferences;
}

const PHASE_LABEL: Record<string, string> = {
  delegations: "Fetching delegations…",
  orders: "Fetching orders…",
  "assembling-delegations": "Packaging delegations…",
  "assembling-orders": "Packaging orders…",
  "assembling-decisions": "Packaging approval decisions…",
};

/**
 * Settings → Privacy: whole-account export (profile, delegations, orders,
 * approval decisions) as one downloadable JSON file — the sovereignty
 * principle from docs/vision.md ("users control their data") applied to a
 * full account, distinct from the table-scoped orders CSV export in the
 * command palette (see hooks/useBuiltinCommands.ts).
 */
export function PrivacyExportCard({ user, preferences }: PrivacyExportCardProps) {
  const { status, progress, error, start, cancel } = useAccountExport();
  const running = status === "running";

  const percent =
    progress && progress.total > 0
      ? Math.round((progress.completed / progress.total) * 100)
      : null;

  return (
    <Card title="Privacy" ariaLabel="Privacy settings">
      <div className="settings-section">
        <div>
          <p className="settings-toggle-label">Export your data</p>
          <p className="settings-toggle-hint">
            Download a complete copy of your account — profile, delegations,
            orders, and approval decisions — as a single JSON file. You control
            your data; this includes everything, not just what&apos;s on
            screen right now.
          </p>
        </div>

        {running && (
          <div className="export-progress" role="status" aria-live="polite">
            <p className="export-progress-label">
              {progress ? PHASE_LABEL[progress.phase] ?? "Exporting…" : "Starting export…"}
            </p>
            <div className="utilization-bar-track">
              <div
                className="utilization-bar-fill"
                style={{ width: `${percent ?? 0}%` }}
              />
            </div>
          </div>
        )}

        {status === "done" && (
          <div className="settings-status success" role="status">
            Export downloaded.
          </div>
        )}
        {status === "cancelled" && (
          <div className="settings-status" role="status">
            Export cancelled.
          </div>
        )}
        {status === "error" && (
          <div className="settings-status error" role="status">
            {error ?? "Export failed."}
          </div>
        )}

        <div className="form-actions">
          {running ? (
            <Button variant="secondary" onClick={cancel}>
              Cancel export
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={() => start(user, preferences)}
            >
              Request full export
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
