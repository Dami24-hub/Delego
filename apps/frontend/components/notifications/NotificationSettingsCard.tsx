"use client";

import { Card } from "@delegolabs/ui";
import { useOsNotifications } from "../../hooks/useOsNotifications";

/**
 * Settings-page opt-in control for desktop notifications (the kill switch).
 * Requesting the browser permission only ever happens from here, in response
 * to this toggle — never automatically on page load.
 */
export function NotificationSettingsCard() {
  const { supported, permission, enabled, setEnabled, requestPermission } = useOsNotifications();

  if (!supported) return null;

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
    <Card title="Desktop notifications" ariaLabel="Desktop notification settings">
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
    </Card>
  );
}
