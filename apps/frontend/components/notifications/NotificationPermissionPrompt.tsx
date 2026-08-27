"use client";

import { useState } from "react";
import { Button, Card } from "@delegolabs/ui";
import { useOsNotifications } from "../../hooks/useOsNotifications";

const DISMISSED_STORAGE_KEY = "delego_os_notifications_prompt_dismissed";

function readDismissed(): boolean {
  try {
    return window.localStorage.getItem(DISMISSED_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

function persistDismissed(): void {
  try {
    window.localStorage.setItem(DISMISSED_STORAGE_KEY, "true");
  } catch {
    // Ignore quota / availability errors.
  }
}

export interface NotificationPermissionPromptProps {
  /** Short context line explaining why this is showing right now. */
  message?: string;
}

/**
 * Dismissible, one-time opt-in prompt for desktop notifications. Never shown
 * on page load by itself — render it only from a contextual trigger (e.g.
 * after a user's first delegation) or from Settings.
 */
export function NotificationPermissionPrompt({
  message = "Get notified about approvals even when this tab isn't in focus.",
}: NotificationPermissionPromptProps) {
  const { supported, permission, requestPermission, setEnabled } =
    useOsNotifications();
  const [dismissed, setDismissed] = useState(readDismissed);

  if (!supported || permission !== "default" || dismissed) return null;

  const dismiss = () => {
    persistDismissed();
    setDismissed(true);
  };

  const enable = async () => {
    const result = await requestPermission();
    if (result === "granted") setEnabled(true);
    dismiss();
  };

  return (
    <Card ariaLabel="Enable desktop notifications">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
          flexWrap: "wrap",
        }}
      >
        <p style={{ margin: 0 }}>{message}</p>
        <div className="form-actions" style={{ margin: 0 }}>
          <Button variant="primary" onClick={enable}>
            Enable
          </Button>
          <Button variant="ghost" onClick={dismiss}>
            Not now
          </Button>
        </div>
      </div>
    </Card>
  );
}
