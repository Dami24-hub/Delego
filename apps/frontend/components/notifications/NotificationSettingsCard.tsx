"use client";

import { Card } from "@delegolabs/ui";
import { useOsNotifications } from "../../hooks/useOsNotifications";
import { useNotifications, type NotificationRetention } from "../../hooks/useNotifications";

/**
 * Settings-page controls for desktop notifications and in-app notification retention (#605).
 */
export function NotificationSettingsCard() {
  const { supported, permission, enabled, setEnabled, requestPermission } = useOsNotifications();
  const { retention, setRetention } = useNotifications();

  const handleToggle = async (checked: boolean) => {
    if (!checked) {
      setEnabled(false);
      return;
    }
    if (permission === "granted") {
      setEnabled(true);
      return;
    }
    const result = await requestPermission();
    setEnabled(result === "granted");
  };

  return (
    <Card title="Notification settings" ariaLabel="Notification settings">
      <div className="settings-section">
        {/* Retention Selector (#605) */}
        <div className="settings-toggle-row">
          <span>
            <span className="settings-toggle-label" id="retention-label">
              Notification retention period
            </span>
            <p className="settings-toggle-hint">
              Automatically clean up read notifications older than the selected timeframe. Unread notifications are kept until read regardless of age.
            </p>
          </span>
          <select
            value={retention}
            onChange={(e) => setRetention(e.target.value as NotificationRetention)}
            aria-labelledby="retention-label"
            style={{
              padding: "0.375rem 0.625rem",
              borderRadius: "0.375rem",
              border: "1px solid var(--color-border)",
              background: "var(--color-bg-surface)",
              color: "var(--color-text-primary)",
              fontSize: "0.875rem",
            }}
          >
            <option value="7">7 days</option>
            <option value="30">30 days (default)</option>
            <option value="90">90 days</option>
            <option value="all">Keep all</option>
          </select>
        </div>

        {/* Desktop Notifications Toggle */}
        {supported && (
          <label className="settings-toggle-row">
            <span>
              <span className="settings-toggle-label">
                Notify me about approvals when this tab isn&apos;t in focus
              </span>
              <p className="settings-toggle-hint">
                {permission === "denied"
                  ? "Blocked in your browser settings — enable notifications for this site to use this."
                  : "Uses your browser's native notifications. You can turn this off at any time."}
              </p>
            </span>
            <input
              type="checkbox"
              checked={enabled && permission === "granted"}
              disabled={permission === "denied"}
              onChange={(e) => handleToggle(e.target.checked)}
              style={{ width: "1.125rem", height: "1.125rem", marginTop: "0.25rem" }}
            />
          </label>
        )}
      </div>
    </Card>
  );
}

