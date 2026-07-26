"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  ApiResponse,
  CreateDelegationInput,
  Delegation,
  UpdateDelegationInput,
} from "@delego/types";
import { api } from "../lib/api";

/**
 * Fetch the current user's delegations from the Delego API.
 */
function isDelegationArray(data: unknown): data is Delegation[] {
  if (!Array.isArray(data)) return false;
  return data.every(
    (item) =>
      typeof item === "object" &&
      item !== null &&
      "id" in item &&
      "userId" in item &&
      "agentId" in item &&
      "status" in item
  );
}

let tempIdSequence = 0;
function createTempId(): string {
  tempIdSequence += 1;
  return `temp-${Date.now()}-${tempIdSequence}`;
}

function toOptimisticDelegation(input: CreateDelegationInput, tempId: string): Delegation {
  const now = new Date();
  return {
    id: tempId,
    userId: "",
    agentId: input.agentId,
    status: "pending",
    policy: {
      maxPerTransaction: BigInt(input.policy.maxPerTransaction),
      maxTotal: BigInt(input.policy.maxTotal),
      allowedMerchants: input.policy.allowedMerchants,
      expiresAt: input.policy.expiresAt ?? null,
    },
    createdAt: now,
    updatedAt: now,
  };
}

function applyOptimisticUpdate(
  delegation: Delegation,
  input: UpdateDelegationInput
): Delegation {
  return {
    ...delegation,
    status: input.status ?? delegation.status,
    policy: {
      ...delegation.policy,
      ...(input.policy?.maxPerTransaction !== undefined && {
        maxPerTransaction: BigInt(input.policy.maxPerTransaction),
      }),
      ...(input.policy?.maxTotal !== undefined && {
        maxTotal: BigInt(input.policy.maxTotal),
      }),
      ...(input.policy?.allowedMerchants !== undefined && {
        allowedMerchants: input.policy.allowedMerchants,
      }),
      ...(input.policy?.expiresAt !== undefined && {
        expiresAt: input.policy.expiresAt,
      }),
    },
    updatedAt: new Date(),
  };
}

export interface UseDelegationsResult {
  delegations: Delegation[];
  loading: boolean;
  error: string | null;
  /** Delegation IDs with an in-flight mutation — render as pending/disabled in the UI */
  pendingIds: Set<string>;
  refresh: () => Promise<void>;
  createDelegation: (input: CreateDelegationInput) => Promise<Delegation | null>;
  updateDelegation: (
    id: string,
    input: UpdateDelegationInput
  ) => Promise<Delegation | null>;
  revokeDelegation: (id: string) => Promise<boolean>;
}

/** Fetch and mutate user delegations, applying optimistic UI updates with rollback on failure. */
export function useDelegations(): UseDelegationsResult {
  const [delegations, setDelegations] = useState<Delegation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());

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

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res: ApiResponse<Delegation[]> = await api.getDelegations();
      if (res.error) {
        setError(res.error.message);
      } else if (!isDelegationArray(res.data)) {
        setError("Invalid response format");
      } else {
        setDelegations(res.data);
      }
    } catch {
      setError("Failed to fetch delegations");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createDelegation = useCallback(
    async (input: CreateDelegationInput): Promise<Delegation | null> => {
      const tempId = createTempId();
      const optimistic = toOptimisticDelegation(input, tempId);

      setError(null);
      setDelegations((prev) => [optimistic, ...prev]);
      setPending(tempId, true);

      try {
        const res = await api.createDelegation(input);
        if (res.error || !res.data) {
          throw new Error(res.error?.message ?? "Failed to create delegation");
        }
        const created = res.data;
        setDelegations((prev) =>
          prev.map((d) => (d.id === tempId ? created : d))
        );
        setPending(tempId, false);
        setPending(created.id, false);
        return created;
      } catch (err) {
        setDelegations((prev) => prev.filter((d) => d.id !== tempId));
        setPending(tempId, false);
        setError(
          err instanceof Error ? err.message : "Failed to create delegation"
        );
        return null;
      }
    },
    [setPending]
  );

  const updateDelegation = useCallback(
    async (
      id: string,
      input: UpdateDelegationInput
    ): Promise<Delegation | null> => {
      let previous: Delegation | undefined;
      setError(null);
      setDelegations((prev) =>
        prev.map((d) => {
          if (d.id !== id) return d;
          previous = d;
          return applyOptimisticUpdate(d, input);
        })
      );
      if (!previous) return null;
      setPending(id, true);

      try {
        const res = await api.updateDelegation(id, input);
        if (res.error || !res.data) {
          throw new Error(res.error?.message ?? "Failed to update delegation");
        }
        const updated = res.data;
        setDelegations((prev) => prev.map((d) => (d.id === id ? updated : d)));
        return updated;
      } catch (err) {
        const rollback = previous;
        setDelegations((prev) =>
          prev.map((d) => (d.id === id && rollback ? rollback : d))
        );
        setError(
          err instanceof Error ? err.message : "Failed to update delegation"
        );
        return null;
      } finally {
        setPending(id, false);
      }
    },
    [setPending]
  );

  const revokeDelegation = useCallback(
    async (id: string): Promise<boolean> => {
      let previous: Delegation | undefined;
      setError(null);
      setDelegations((prev) =>
        prev.map((d) => {
          if (d.id !== id) return d;
          previous = d;
          return { ...d, status: "revoked" };
        })
      );
      if (!previous) return false;
      setPending(id, true);

      try {
        const res = await api.revokeDelegation(id);
        if (res.error) {
          throw new Error(res.error.message);
        }
        return true;
      } catch (err) {
        const rollback = previous;
        setDelegations((prev) =>
          prev.map((d) => (d.id === id && rollback ? rollback : d))
        );
        setError(
          err instanceof Error ? err.message : "Failed to revoke delegation"
        );
        return false;
      } finally {
        setPending(id, false);
      }
    },
    [setPending]
  );

  return {
    delegations,
    loading,
    error,
    pendingIds,
    refresh,
    createDelegation,
    updateDelegation,
    revokeDelegation,
  };
}
