import type { AppNotification } from "../hooks/useNotifications";

export interface NotificationStack {
  delegationId: string;
  items: AppNotification[];
  latest: AppNotification;
  unreadCount: number;
}

export type NotificationGroupEntry =
  | { type: "single"; notification: AppNotification }
  | { type: "stack"; stack: NotificationStack };

/**
 * Pure function to group notifications by delegationId when grouping is enabled (#604).
 * - Items with delegationId are grouped into collapsible stacks.
 * - System notices (items without delegationId) remain top-level single entries.
 * - Main list maintains top-level ordering by latest item timestamp.
 */
export function groupNotifications(
  notifications: AppNotification[],
  groupingEnabled: boolean = true
): NotificationGroupEntry[] {
  if (!Array.isArray(notifications)) return [];
  if (!groupingEnabled) {
    return notifications.map((n) => ({ type: "single", notification: n }));
  }

  const stacksMap = new Map<string, AppNotification[]>();
  const topLevelEntries: NotificationGroupEntry[] = [];

  // Group items with a delegationId into stacksMap
  for (const n of notifications) {
    if (n.delegationId) {
      const existing = stacksMap.get(n.delegationId) || [];
      existing.push(n);
      stacksMap.set(n.delegationId, existing);
    } else {
      topLevelEntries.push({ type: "single", notification: n });
    }
  }

  // Build stacks for each delegationId
  for (const [delegationId, items] of stacksMap.entries()) {
    // Sort items newest first
    const sorted = [...items].sort((a, b) => b.createdAt - a.createdAt);
    const latest = sorted[0];
    const unreadCount = sorted.reduce(
      (cnt, item) => (item.read ? cnt : cnt + 1),
      0
    );

    topLevelEntries.push({
      type: "stack",
      stack: {
        delegationId,
        items: sorted,
        latest,
        unreadCount,
      },
    });
  }

  // Sort all top-level entries (singles and stacks) by their latest creation timestamp
  return topLevelEntries.sort((a, b) => {
    const timeA =
      a.type === "single" ? a.notification.createdAt : a.stack.latest.createdAt;
    const timeB =
      b.type === "single" ? b.notification.createdAt : b.stack.latest.createdAt;
    return timeB - timeA;
  });
}
