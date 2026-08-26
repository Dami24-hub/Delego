"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import { useAnnounce } from "./useAnnounce";

export type NotificationType = "info" | "success" | "warning" | "error";

export type NotificationRetention = "7" | "30" | "90" | "all";

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  /** Optional longer body */
  message?: string;
  /** Epoch millis the notification was created */
  createdAt: number;
  read: boolean;
  /** Optional in-app link to navigate to when clicked */
  href?: string;
}

/** Shape accepted when pushing a new notification (id/time/read are filled in). */
export type NewNotification = Omit<
  AppNotification,
  "id" | "createdAt" | "read"
> & {
  id?: string;
  createdAt?: number;
};

interface NotificationContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  retention: NotificationRetention;
  setRetention: (retention: NotificationRetention) => void;
  add: (notification: NewNotification) => string;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  remove: (id: string) => void;
  clearAll: () => void;
  undoClearAll: () => void;
  dismissUndo: () => void;
  canUndoClear: boolean;
  pruneNow: () => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

const STORAGE_KEY = "delego_notifications";
const RETENTION_STORAGE_KEY = "delego_notification_retention";
export const MAX_NOTIFICATIONS = 500; // Cap to keep storage footprint minimal even under heavy usage (#605)

const DAY_MS = 24 * 60 * 60 * 1000;

export const RETENTION_MS_MAP: Record<Exclude<NotificationRetention, "all">, number> = {
  "7": 7 * DAY_MS,
  "30": 30 * DAY_MS,
  "90": 90 * DAY_MS,
};

/**
 * Pure prune function (#605):
 * - Prunes read notifications older than retention cutoff (based on epoch millis).
 * - EXPLICIT RULE: Unread notifications (!n.read) ALWAYS survive past retention cutoff.
 * - Enforces hard cap of MAX_NOTIFICATIONS to prevent storage quota exhaustion.
 */
export function pruneNotifications(
  items: AppNotification[],
  retention: NotificationRetention,
  now: number = Date.now()
): AppNotification[] {
  if (!Array.isArray(items)) return [];

  const pruned = items.filter((n) => {
    if (!n || typeof n.createdAt !== "number") return false;
    // Unread items always survive past the retention window
    if (!n.read) return true;
    if (retention === "all") return true;

    const retentionMs = RETENTION_MS_MAP[retention];
    if (typeof retentionMs !== "number") return true;

    // Prune if read and age exceeds retention window
    const ageMs = now - n.createdAt;
    return ageMs <= retentionMs;
  });

  return pruned.slice(0, MAX_NOTIFICATIONS);
}

function generateId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  return `n_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function loadStored(): AppNotification[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (n): n is AppNotification =>
        n &&
        typeof n.id === "string" &&
        typeof n.title === "string" &&
        typeof n.createdAt === "number"
    );
  } catch {
    return [];
  }
}

function loadStoredRetention(): NotificationRetention {
  try {
    const raw = window.localStorage.getItem(RETENTION_STORAGE_KEY);
    if (raw === "7" || raw === "30" || raw === "90" || raw === "all") {
      return raw;
    }
  } catch {
    /* ignore */
  }
  return "30";
}

/**
 * In-app notification store backed by localStorage.
 * Includes retention preference pruning, unread survival, and soft-delete clear-all with undo.
 */
export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [retention, setRetentionState] = useState<NotificationRetention>("30");
  const [clearedBackup, setClearedBackup] = useState<AppNotification[] | null>(null);
  const { announce } = useAnnounce();

  // Initial load + lazy boot pruning (#605)
  useEffect(() => {
    const initialRetention = loadStoredRetention();
    setRetentionState(initialRetention);
    const loaded = loadStored();
    const pruned = pruneNotifications(loaded, initialRetention);
    setNotifications(pruned);
  }, []);

  // Persist notifications on change.
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
    } catch {
      // Ignore quota / availability errors.
    }
  }, [notifications]);

  // Persist retention setting on change.
  const setRetention = useCallback((nextRetention: NotificationRetention) => {
    setRetentionState(nextRetention);
    try {
      window.localStorage.setItem(RETENTION_STORAGE_KEY, nextRetention);
    } catch {
      /* ignore */
    }
    setNotifications((prev) => pruneNotifications(prev, nextRetention));
  }, []);

  // Cross-tab sync.
  useEffect(() => {
    function onStorage(event: StorageEvent) {
      if (event.key === STORAGE_KEY) {
        setNotifications(pruneNotifications(loadStored(), retention));
      } else if (event.key === RETENTION_STORAGE_KEY) {
        const updatedRetention = loadStoredRetention();
        setRetentionState(updatedRetention);
        setNotifications((prev) => pruneNotifications(prev, updatedRetention));
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [retention]);

  const pruneNow = useCallback(() => {
    setNotifications((prev) => pruneNotifications(prev, retention));
  }, [retention]);

  const add = useCallback((notification: NewNotification) => {
    const id = notification.id ?? generateId();
    const entry: AppNotification = {
      type: notification.type,
      title: notification.title,
      message: notification.message,
      href: notification.href,
      id,
      createdAt: notification.createdAt ?? Date.now(),
      read: false,
    };
    setNotifications((prev) =>
      pruneNotifications([entry, ...prev.filter((n) => n.id !== id)], retention)
    );
    announce(
      entry.title,
      entry.type === "error" ? "assertive" : "polite"
    );
    return id;
  }, [announce, retention]);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const remove = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  // Soft-delete clear all with undo capability (#605)
  const clearAll = useCallback(() => {
    setNotifications((prev) => {
      setClearedBackup(prev);
      return [];
    });
    announce("All notifications cleared.", "polite");
  }, [announce]);

  const undoClearAll = useCallback(() => {
    if (clearedBackup) {
      setNotifications(clearedBackup);
      setClearedBackup(null);
      announce("Notifications restored.", "polite");
    }
  }, [clearedBackup, announce]);

  const dismissUndo = useCallback(() => {
    setClearedBackup(null);
  }, []);

  const value = useMemo<NotificationContextValue>(() => {
    const unreadCount = notifications.reduce(
      (count, n) => (n.read ? count : count + 1),
      0
    );
    return {
      notifications,
      unreadCount,
      retention,
      setRetention,
      add,
      markAsRead,
      markAllAsRead,
      remove,
      clearAll,
      undoClearAll,
      dismissUndo,
      canUndoClear: clearedBackup !== null && clearedBackup.length > 0,
      pruneNow,
    };
  }, [
    notifications,
    retention,
    setRetention,
    add,
    markAsRead,
    markAllAsRead,
    remove,
    clearAll,
    undoClearAll,
    dismissUndo,
    clearedBackup,
    pruneNow,
  ]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

/** Access the notification store. Must be used within a NotificationProvider. */
export function useNotifications(): NotificationContextValue {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider"
    );
  }
  return ctx;
}
