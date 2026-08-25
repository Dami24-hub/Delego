/**
 * Wire-format (JSON-safe) fixtures for Playwright route interception (FE-044/FE-046).
 *
 * `DelegoClient` deserializes gateway JSON into `bigint`/`Date` before handing
 * data to hooks (see hooks/useDelegations.ts, lib/orders.ts), so these
 * builders mirror what the real gateway sends over the wire — stroops as
 * numeric strings, dates as ISO strings — not the in-memory fixture shapes
 * used by mocks/fixtures/*.ts (which vitest's MSW layer consumes directly).
 */

export function jsonDelegation(seed: number, overrides: Record<string, unknown> = {}) {
  return {
    id: `delegation-${seed}`,
    userId: "user-e2e",
    agentId: `agent-${seed}`,
    walletId: "GDE2E0000000000000000000000000000000000000000000000000",
    label: `Shopping Agent ${seed}`,
    status: "active",
    permissionLevel: "AUTO_APPROVE",
    policy: {
      maxPerTransaction: "500000000",
      maxTotal: "50000000000",
      allowedMerchants: [],
      allowedCategories: [],
      expiresAt: null,
    },
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

export function jsonOrder(seed: number, overrides: Record<string, unknown> = {}) {
  return {
    id: `order-${seed}`,
    userId: "user-e2e",
    delegationId: `delegation-${seed}`,
    merchantId: `merchant-${seed}`,
    status: "pending_approval",
    totalStroops: "15000000000",
    lineItems: [
      { productId: `product-${seed}`, quantity: 1, unitPriceStroops: "15000000000" },
    ],
    escrowContractId: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

export function jsonEscrow(seed: number, overrides: Record<string, unknown> = {}) {
  return {
    escrowId: `escrow-${seed}`,
    orderId: `order-${seed}`,
    amount: "15000000000",
    buyer: "GBUYER0000000000000000000000000000000000000000000000000",
    seller: "GSELLER000000000000000000000000000000000000000000000000",
    token: `token-${seed}`,
    status: "Funded",
    timeoutLedger: 1_010_000,
    currentLedger: 1_000_000,
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

export function okBody(data: unknown) {
  return { data, error: null };
}

/** Synthetic Freighter address used by the wallet-connect E2E scenario. */
export const E2E_WALLET_ADDRESS =
  "GAE2ETESTWALLET0000000000000000000000000000000000000000";
