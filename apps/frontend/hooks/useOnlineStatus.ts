"use client";

import { useEffect, useMemo, useState } from "react";
import type { OfflineStatus as ConnectionStatus } from "@delegolabs/types";
import { listCachedReads } from "../lib/offlineCache";

/** Accessible reason attached to controls disabled while offline. */
export const OFFLINE_BLOCKED_MESSAGE =
  "You're offline — reconnect to continue.";

export interface UseOnlineStatusResult {
  /** Connection status from the browser (online/offline/reconnecting). */
  connectionStatus: ConnectionStatus;
  /**
   * Number of orders cached for offline browsing. Populated when
   * `connectionStatus` is "offline" or "reconnecting".
   */
  cachedOrdersCount: number;
  /**
   * Timestamp of the last successful sync with the server, or null if
   * no sync has occurred or service worker is unavailable.
   */
  lastSyncedAt: Date | null;
  /**
   * Spread onto a control to disable it while offline with an accessible
   * reason (`title`), mirroring `useDemoModeGuard`'s `disabledProps`.
   */
  disabledProps:
    | { disabled: true; title: string }
    | Record<string, never>;
}

/**
 * Tracks browser connectivity via `navigator.onLine` plus the window
 * `online`/`offline` events, and surfaces what the service worker has cached
 * for offline reading (#773).
 *
 * SSR-safe: the server and the first client render both assume online
 * (`connectionStatus: "online"`) so the markup matches during hydration; the effect
 * reconciles against the real `navigator.onLine` value immediately after
 * mount — the same hydration pattern as DemoBanner/DomainWarningBanner.
 *
 * `cachedOrdersCount`/`lastSyncedAt` come straight from `lib/offlineCache.ts`
 * (a Cache Storage read, so no network round-trip) and default to 0/null
 * before the first read or in browsers without service worker support.
 */
export function useOnlineStatus(): UseOnlineStatusResult {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("online");
  const [cachedOrdersCount, setCachedOrdersCount] = useState(0);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

  useEffect(() => {
    function update() {
      if (!navigator.onLine) {
        setConnectionStatus("offline");
      } else {
        // Try to detect reconnecting state by checking if we were offline recently
        // For now, just set to online when navigator.onLine is true
        setConnectionStatus("online");
      }
    }

    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  // Re-read the cache whenever connectivity flips: a reconnect populates the
  // API read cache, and a disconnect is exactly when the counts matter.
  useEffect(() => {
    let active = true;
    void listCachedReads().then((reads) => {
      if (!active) return;
      setCachedOrdersCount(reads.filter((r) => r.label === "Orders").length);
      setLastSyncedAt(
        reads.reduce<Date | null>((latest, read) => {
          if (!read.cachedAt) return latest;
          return !latest || read.cachedAt > latest ? read.cachedAt : latest;
        }, null)
      );
    });
    return () => {
      active = false;
    };
  }, [connectionStatus]);

  return useMemo(
    () => ({
      connectionStatus,
      cachedOrdersCount,
      lastSyncedAt,
      disabledProps: connectionStatus !== "online"
        ? { disabled: true as const, title: OFFLINE_BLOCKED_MESSAGE }
        : ({} as Record<string, never>),
    }),
    [connectionStatus, cachedOrdersCount, lastSyncedAt]
  );
}
