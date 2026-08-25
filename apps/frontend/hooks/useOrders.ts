"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Order } from "@delegolabs/types";
import { api } from "../lib/api";
import {
  adaptOrders,
  adaptOrder,
  type ListOrdersResponse,
  type ApproveOrderResponse,
  type RejectOrderResponse,
} from "@delegolabs/api-generated";

/**
 * Fetch (and optionally poll) the current user's orders from the Delego API,
 * with optimistic approve/reject mutations for the approval workflow.
 *
 * The approvals module is fully typed end-to-end from the OpenAPI spec via
 * @delegolabs/api-generated (#633). Raw API responses are adapted to the
 * application domain model (Date, bigint) by adaptOrder(s) before being
 * stored in state — no hand-written interfaces remain in this module.
 */

export interface UseOrdersOptions {
  /**
   * When set to a positive number, re-fetch orders on this interval (ms) so the
   * tracking dashboard reflects near-real-time status changes. Omit to fetch once.
   */
  pollIntervalMs?: number;
}

export interface UseOrdersResult {
  orders: Order[];
  loading: boolean;
  error: string | null;
  /** Timestamp of the last successful fetch, or null before the first load. */
  lastUpdated: Date | null;
  /** Order IDs with an in-flight approve/reject mutation. */
  pendingIds: Set<string>;
  refresh: () => Promise<void>;
  approveOrder: (id: string) => Promise<Order | null>;
  rejectOrder: (id: string, reason?: string) => Promise<Order | null>;
}

export function useOrders(options: UseOrdersOptions = {}): UseOrdersResult {
  const { pollIntervalMs } = options;
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());

  // Guards against setting state after unmount during polling / async work.
  const mountedRef = useRef(true);

  const setPending = useCallback((id: string, isPending: boolean) => {
    setPendingIds((prev) => {
      const next = new Set(prev);
      if (isPending) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }, []);

  const load = useCallback(async (signal?: AbortSignal) => {
    try {
      // Typed against the generated ListOrdersResponse from the OpenAPI spec.
      const res = (await api.getOrders({ signal })) as ListOrdersResponse;
      if (signal?.aborted || !mountedRef.current) return;
      if (res.error) {
        setError(res.error.message);
      } else if (!Array.isArray(res.data)) {
        setError("Invalid response format");
      } else {
        // Adapt generated API order shape → domain order shape (Date, bigint).
        setOrders(adaptOrders(res.data));
        setLastUpdated(new Date());
        setError(null);
      }
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      if (mountedRef.current) setError("Failed to fetch orders");
    } finally {
      if (!signal?.aborted && mountedRef.current) setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    await load();
  }, [load]);

  useEffect(() => {
    mountedRef.current = true;
    const controller = new AbortController();
    load(controller.signal);

    let timer: ReturnType<typeof setInterval> | undefined;
    if (pollIntervalMs && pollIntervalMs > 0) {
      timer = setInterval(() => {
        load(controller.signal);
      }, pollIntervalMs);
    }

    return () => {
      mountedRef.current = false;
      controller.abort();
      if (timer) clearInterval(timer);
    };
  }, [load, pollIntervalMs]);

  const runMutation = useCallback(
    async (
      id: string,
      call: () => Promise<ApproveOrderResponse | RejectOrderResponse>
    ): Promise<Order | null> => {
      setPending(id, true);
      setError(null);
      try {
        const res = await call();
        if (res.error) {
          setError(res.error.message);
          return null;
        }
        if (res.data) {
          // Adapt generated API shape → domain shape before storing.
          const updated = adaptOrder(res.data);
          setOrders((prev) =>
            prev.map((order) => (order.id === id ? updated : order))
          );
          return updated;
        }
        return null;
      } catch {
        setError("Failed to update order");
        return null;
      } finally {
        setPending(id, false);
      }
    },
    [setPending]
  );

  const approveOrder = useCallback(
    (id: string) =>
      runMutation(id, () => api.approveOrder(id) as Promise<ApproveOrderResponse>),
    [runMutation]
  );

  const rejectOrder = useCallback(
    (id: string, reason?: string) =>
      runMutation(id, () =>
        api.rejectOrder(id, reason) as Promise<RejectOrderResponse>
      ),
    [runMutation]
  );

  return {
    orders,
    loading,
    error,
    lastUpdated,
    pendingIds,
    refresh,
    approveOrder,
    rejectOrder,
  };
}
