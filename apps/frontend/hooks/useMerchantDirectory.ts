"use client";

import { useEffect, useState } from "react";
import { fetchMerchantDirectory, type DirectoryMerchant } from "../lib/merchantDirectory";

export interface UseMerchantDirectoryResult {
  merchants: DirectoryMerchant[];
  loading: boolean;
  error: string | null;
}

/** Load the gateway's merchant directory once, for the whitelist picker (#524). */
export function useMerchantDirectory(): UseMerchantDirectoryResult {
  const [merchants, setMerchants] = useState<DirectoryMerchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetchMerchantDirectory(controller.signal).then((result) => {
      if (controller.signal.aborted) return;
      setMerchants(result.merchants);
      setError(result.error);
      setLoading(false);
    });
    return () => controller.abort();
  }, []);

  return { merchants, loading, error };
}
