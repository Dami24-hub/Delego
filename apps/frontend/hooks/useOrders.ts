"use client";

import { useEffect, useState } from "react";
import type { ApiResponse, Order } from "@delego/types";
import { api } from "../lib/api";

/**
 * Fetch the current user's orders from the Delego API.
 */
function isOrderArray(data: unknown): data is Order[] {
  if (!Array.isArray(data)) return false;
  return data.every(
    (item) =>
      typeof item === "object" &&
      item !== null &&
      "id" in item &&
      "userId" in item &&
      "status" in item
  );
}

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    api
      .getOrders()
      .then((res: ApiResponse<Order[]>) => {
        if (res.error) {
          setError(res.error.message);
        } else if (!isOrderArray(res.data)) {
          setError("Invalid response format");
        } else {
          setOrders(res.data);
        }
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }
        setError("Failed to fetch orders");
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, []);

  return { orders, loading, error };
}
