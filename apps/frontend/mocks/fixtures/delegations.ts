import type {
  ApiResponse,
  CreateDelegationInput,
  Delegation,
  DelegationPermissionLevel,
} from "@delegolabs/types";
import { createSeededRandom, pick, seededId, seededStellarAddress } from "./faker-lite";

const STATUSES: Delegation["status"][] = ["active", "paused", "revoked", "expired", "pending"];
const PERMISSION_LEVELS: DelegationPermissionLevel[] = [
  "VIEW_ONLY",
  "AUTO_APPROVE",
  "SIGNER",
  "ADMIN",
];

/** Build one deterministic Delegation fixture from a numeric seed. */
export function buildDelegation(seed: number, overrides: Partial<Delegation> = {}): Delegation {
  const rand = createSeededRandom(seed);
  const now = new Date("2026-01-01T00:00:00.000Z");

  return {
    id: seededId("delegation", rand),
    userId: seededId("user", rand),
    agentId: seededId("agent", rand),
    walletId: seededStellarAddress(rand),
    label: `Agent ${seed}`,
    status: pick(STATUSES, rand),
    permissionLevel: pick(PERMISSION_LEVELS, rand),
    policy: {
      maxPerTransaction: BigInt(Math.floor(rand() * 500) + 1) * 10_000_000n,
      maxTotal: BigInt(Math.floor(rand() * 5000) + 500) * 10_000_000n,
      allowedMerchants: [],
      allowedCategories: [],
      expiresAt: null,
    },
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

/** Populated list (FE-035 empty-state pairing: use `[]` directly for the empty case). */
export function buildDelegationList(count = 5): Delegation[] {
  return Array.from({ length: count }, (_, i) => buildDelegation(i + 1));
}

export function delegationCreatedFrom(input: CreateDelegationInput): Delegation {
  const now = new Date();
  return {
    id: `delegation-${now.getTime()}`,
    userId: "user-mock",
    agentId: input.agentId,
    walletId: input.walletId,
    label: input.label,
    status: "pending",
    permissionLevel: input.permissionLevel,
    policy: {
      maxPerTransaction: BigInt(input.policy.maxPerTransaction),
      maxTotal: BigInt(input.policy.maxTotal),
      allowedMerchants: input.policy.allowedMerchants,
      allowedCategories: input.policy.allowedCategories,
      expiresAt: input.policy.expiresAt ?? null,
    },
    createdAt: now,
    updatedAt: now,
  };
}

export function okResponse<T>(data: T): ApiResponse<T> {
  return { data, error: null };
}

export function errorResponse<T>(message: string, code = "internal_error"): ApiResponse<T> {
  return { data: null, error: { code, message } };
}
