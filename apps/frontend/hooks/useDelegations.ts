"use client";

import { useEffect, useState } from "react";
import type { ApiResponse, Delegation } from "@delego/types";
import { api } from "../lib/api";

/**
 * Fetch the current user's delegations from the Delego API.
 */
export function useDelegations() {
  const [delegations, setDelegations] = useState<Delegation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDelegations().then((res: ApiResponse<Delegation[]>) => {
      if (res.data) setDelegations(res.data);
      setLoading(false);
    });
  }, []);

  return { delegations, loading };
}
