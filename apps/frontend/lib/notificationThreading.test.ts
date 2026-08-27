import { describe, expect, it } from "vitest";
import type { AppNotification } from "../hooks/useNotifications";
import { groupNotifications } from "./notificationThreading";

function makeNotification(
  overrides: Partial<AppNotification>
): AppNotification {
  return {
    id: `id-${Math.random()}`,
    type: "info",
    title: "Notification",
    createdAt: Date.now(),
    read: false,
    ...overrides,
  };
}

describe("Notification Threading & Grouping (#604)", () => {
  it("restores flat chronology exactly when grouping toggle is OFF", () => {
    const items: AppNotification[] = [
      makeNotification({ id: "1", createdAt: 100, delegationId: "del-A" }),
      makeNotification({ id: "2", createdAt: 200, delegationId: "del-A" }),
      makeNotification({ id: "3", createdAt: 150 }),
    ];

    const result = groupNotifications(items, false);
    expect(result).toHaveLength(3);
    expect(result.every((r) => r.type === "single")).toBe(true);
    expect(result.map((r) => r.type === "single" && r.notification.id)).toEqual(
      ["1", "2", "3"]
    );
  });

  it("groups notifications by delegationId when toggle is ON", () => {
    const items: AppNotification[] = [
      makeNotification({
        id: "1",
        delegationId: "del-A",
        createdAt: 100,
        read: false,
      }),
      makeNotification({
        id: "2",
        delegationId: "del-A",
        createdAt: 300,
        read: true,
      }),
      makeNotification({
        id: "3",
        delegationId: "del-B",
        createdAt: 200,
        read: false,
      }),
      makeNotification({ id: "4", createdAt: 250, title: "System Notice" }), // no delegationId
    ];

    const result = groupNotifications(items, true);

    // Expect 3 top-level entries: del-A stack (latest 300), System notice single (250), del-B stack (200)
    expect(result).toHaveLength(3);
    expect(result[0].type).toBe("stack");
    if (result[0].type === "stack") {
      expect(result[0].stack.delegationId).toBe("del-A");
      expect(result[0].stack.items).toHaveLength(2);
      expect(result[0].stack.unreadCount).toBe(1);
      expect(result[0].stack.latest.id).toBe("2");
    }

    expect(result[1].type).toBe("single");
    if (result[1].type === "single") {
      expect(result[1].notification.id).toBe("4");
    }

    expect(result[2].type).toBe("stack");
    if (result[2].type === "stack") {
      expect(result[2].stack.delegationId).toBe("del-B");
      expect(result[2].stack.unreadCount).toBe(1);
    }
  });

  it("reconciles rollup counts with expanded items on shuffled fixtures (property test)", () => {
    const fixtureList: AppNotification[] = Array.from({ length: 50 }, (_, i) =>
      makeNotification({
        id: `n-${i}`,
        delegationId: i % 4 === 0 ? undefined : `del-${i % 3}`,
        read: i % 2 === 0,
        createdAt: 1000 + i * 10,
      })
    );

    // Shuffle fixture list
    const shuffled = [...fixtureList].sort(() => Math.random() - 0.5);

    const grouped = groupNotifications(shuffled, true);
    let totalUnreadFromGroups = 0;
    let totalItemsFromGroups = 0;

    for (const entry of grouped) {
      if (entry.type === "single") {
        totalItemsFromGroups += 1;
        if (!entry.notification.read) totalUnreadFromGroups += 1;
      } else {
        totalItemsFromGroups += entry.stack.items.length;
        totalUnreadFromGroups += entry.stack.unreadCount;

        // Verify stack's unread rollup matches sum of unread children
        const expectedStackUnread = entry.stack.items.filter(
          (item) => !item.read
        ).length;
        expect(entry.stack.unreadCount).toBe(expectedStackUnread);
      }
    }

    expect(totalItemsFromGroups).toBe(fixtureList.length);
    const totalExpectedUnread = fixtureList.filter((n) => !n.read).length;
    expect(totalUnreadFromGroups).toBe(totalExpectedUnread);
  });
});
