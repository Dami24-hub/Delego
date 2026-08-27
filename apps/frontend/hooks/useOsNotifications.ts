"use client";

import { useCallback, useEffect, useState } from "react";

const ENABLED_STORAGE_KEY = "delego_os_notifications_enabled";

export type OsNotificationPermission =
  "default" | "granted" | "denied" | "unsupported";

export interface NotifyOptions {
  title: string;
  body?: string;
  /** Deduplication tag: only one native notification per tag is shown at a time. */
  tag?: string;
  onClick?: () => void;
}

export interface UseOsNotificationsResult {
  supported: boolean;
  permission: OsNotificationPermission;
  /** User-controlled kill switch, independent of (and never wider than) the browser permission. */
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
  /** Prompts the browser permission dialog. Call only from a user gesture (e.g. a settings toggle). */
  requestPermission: () => Promise<OsNotificationPermission>;
  /**
   * Fire a native OS notification. Only actually shows one when supported,
   * permitted, enabled via the kill switch, and the tab is currently hidden —
   * this hook is for alerting users away from the tab, not duplicating
   * in-app UI. Returns whether it fired.
   */
  notify: (options: NotifyOptions) => boolean;
}

function readStoredEnabled(): boolean {
  try {
    return window.localStorage.getItem(ENABLED_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

/** Native OS notification permission + user opt-in state, gated to background tabs only. */
export function useOsNotifications(): UseOsNotificationsResult {
  const supported = typeof window !== "undefined" && "Notification" in window;
  const [permission, setPermission] = useState<OsNotificationPermission>(
    supported
      ? (Notification.permission as OsNotificationPermission)
      : "unsupported"
  );
  const [enabled, setEnabledState] = useState(false);

  useEffect(() => {
    setEnabledState(readStoredEnabled());
  }, []);

  const setEnabled = useCallback((value: boolean) => {
    setEnabledState(value);
    try {
      window.localStorage.setItem(ENABLED_STORAGE_KEY, String(value));
    } catch {
      // Ignore quota / availability errors.
    }
  }, []);

  const requestPermission =
    useCallback(async (): Promise<OsNotificationPermission> => {
      if (!supported) return "unsupported";
      const result =
        (await Notification.requestPermission()) as OsNotificationPermission;
      setPermission(result);
      return result;
    }, [supported]);

  const notify = useCallback(
    ({ title, body, tag, onClick }: NotifyOptions): boolean => {
      if (!supported || permission !== "granted" || !enabled) return false;
      if (typeof document !== "undefined" && !document.hidden) return false;

      const notification = new Notification(title, { body, tag });
      notification.onclick = () => {
        window.focus();
        onClick?.();
        notification.close();
      };
      return true;
    },
    [supported, permission, enabled]
  );

  return {
    supported,
    permission,
    enabled,
    setEnabled,
    requestPermission,
    notify,
  };
}
