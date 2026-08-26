"use client";

import { useEffect, useRef } from "react";
import type { Order } from "@delegolabs/types";
import { formatXlm } from "../lib/orders";
import { useNotifications } from "./useNotifications";
import { useOsNotifications } from "./useOsNotifications";

export interface UseApprovalNotificationsOptions {
  /** The current approval queue (orders needing sign-off), in any order. */
  queue: Order[];
  /** True while the first fetch is in flight — used to seed without notifying. */
  loading: boolean;
  /** Where clicking the notification should take the user. */
  buildHref?: (order: Order) => string;
}

/**
 * Watches the approval queue for orders that weren't there on the previous
 * check and raises exactly one in-app + (if the tab is hidden and the user
 * opted in) native OS notification per newly-arrived approval.
 *
 * The queue existing on first load is "seeded" (not notified) so opening the
 * approvals page doesn't fire a burst of notifications for work that was
 * already pending.
 */
export function useApprovalNotifications({
  queue,
  loading,
  buildHref = (order) => `/approvals?focus=${order.id}`,
}: UseApprovalNotificationsOptions): void {
  const { add } = useNotifications();
  const { notify } = useOsNotifications();
  const seenIds = useRef<Set<string> | null>(null);

  useEffect(() => {
    if (loading) return;

    if (seenIds.current === null) {
      // First successful load: remember what's already pending, don't notify for it.
      seenIds.current = new Set(queue.map((order) => order.id));
      return;
    }

    for (const order of queue) {
      if (seenIds.current.has(order.id)) continue;
      seenIds.current.add(order.id);

      const href = buildHref(order);
      add({
        id: `approval-${order.id}`,
        type: "info",
        title: "New approval waiting",
        message: `Order ${order.id} — ${formatXlm(order.totalStroops)} XLM`,
        href,
      });

      notify({
        title: "New approval waiting",
        body: `Order ${order.id} — ${formatXlm(order.totalStroops)} XLM`,
        tag: `approval-${order.id}`,
        onClick: () => {
          window.location.href = href;
        },
      });
    }
  }, [queue, loading, add, notify, buildHref]);
}
