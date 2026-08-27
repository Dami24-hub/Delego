import { describe, it, expect } from "vitest";
import type { Order } from "@delegolabs/types";
import {
  SLA_WARNING_HOURS,
  SLA_CRITICAL_HOURS,
  STALE_DIGEST_THRESHOLD_HOURS,
  countStaleApprovals,
  formatApprovalAge,
  getApprovalAgeMs,
  getApprovalUrgency,
} from "./approvals";

function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: "order-1",
    userId: "user-1",
    delegationId: "del-1",
    merchantId: "merchant-1",
    status: "pending_approval",
    lineItems: [],
    totalStroops: 2_000n * 10_000_000n, // above the high-value threshold
    escrowContractId: null,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z"),
    ...overrides,
  };
}

describe("getApprovalAgeMs", () => {
  it("computes elapsed time via UTC epoch millis, independent of timezone", () => {
    const createdAt = new Date("2026-01-01T00:00:00Z");
    const now = new Date("2026-01-01T05:00:00Z");
    expect(getApprovalAgeMs(createdAt, now)).toBe(5 * 3_600_000);
  });

  it("agrees on age regardless of the reader's local timezone rendering the same instants", () => {
    // Two Date objects that are the same instant but written with different
    // offsets — epoch-millis math must be unaffected by how they're printed.
    const createdAt = new Date("2026-01-01T00:00:00.000Z");
    const createdAtLocalOffset = new Date("2026-01-01T02:00:00.000+02:00");
    expect(createdAt.getTime()).toBe(createdAtLocalOffset.getTime());

    const now = new Date("2026-01-02T00:00:00.000Z");
    expect(getApprovalAgeMs(createdAt, now)).toBe(
      getApprovalAgeMs(createdAtLocalOffset, now)
    );
  });

  it("never returns a negative age for clock skew where now < createdAt", () => {
    const createdAt = new Date("2026-01-02T00:00:00Z");
    const now = new Date("2026-01-01T00:00:00Z"); // clock skew: "now" before "createdAt"
    expect(getApprovalAgeMs(createdAt, now)).toBe(0);
  });
});

describe("formatApprovalAge", () => {
  it("formats sub-minute ages as 'just now'", () => {
    expect(formatApprovalAge(30_000)).toBe("just now");
  });

  it("formats minutes", () => {
    expect(formatApprovalAge(42 * 60_000)).toBe("42m");
  });

  it("formats hours", () => {
    expect(formatApprovalAge(5 * 3_600_000)).toBe("5h");
  });

  it("formats days once past 24 hours", () => {
    expect(formatApprovalAge(3 * 24 * 3_600_000)).toBe("3d");
  });
});

describe("getApprovalUrgency", () => {
  it("is normal below the warning threshold", () => {
    expect(getApprovalUrgency((SLA_WARNING_HOURS - 1) * 3_600_000)).toBe(
      "normal"
    );
  });

  it("is warning at/after the warning threshold and before critical", () => {
    expect(getApprovalUrgency(SLA_WARNING_HOURS * 3_600_000)).toBe("warning");
    expect(getApprovalUrgency((SLA_CRITICAL_HOURS - 1) * 3_600_000)).toBe(
      "warning"
    );
  });

  it("is critical at/after the critical threshold", () => {
    expect(getApprovalUrgency(SLA_CRITICAL_HOURS * 3_600_000)).toBe("critical");
  });

  it("respects custom thresholds", () => {
    expect(getApprovalUrgency(2 * 3_600_000, 1, 3)).toBe("warning");
    expect(getApprovalUrgency(4 * 3_600_000, 1, 3)).toBe("critical");
  });
});

describe("countStaleApprovals", () => {
  const now = new Date("2026-01-10T00:00:00Z");

  it("counts only pending-approval, high-value orders older than the threshold", () => {
    const orders = [
      makeOrder({ id: "old-1", createdAt: new Date("2026-01-01T00:00:00Z") }), // 9 days old
      makeOrder({ id: "recent", createdAt: new Date("2026-01-09T12:00:00Z") }), // 12h old
      makeOrder({
        id: "old-but-not-high-value",
        createdAt: new Date("2026-01-01T00:00:00Z"),
        totalStroops: 1n,
      }),
      makeOrder({
        id: "old-but-approved",
        createdAt: new Date("2026-01-01T00:00:00Z"),
        status: "approved",
      }),
    ];
    expect(countStaleApprovals(orders, now, STALE_DIGEST_THRESHOLD_HOURS)).toBe(
      1
    );
  });

  it("returns 0 when nothing is stale", () => {
    const orders = [makeOrder({ createdAt: new Date("2026-01-09T23:00:00Z") })];
    expect(countStaleApprovals(orders, now)).toBe(0);
  });
});
