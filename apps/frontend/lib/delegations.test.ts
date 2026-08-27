import { describe, expect, it } from "vitest";
import {
  calculateSpendHeadroom,
  formatPeriodRollover,
  isDelegationExpired,
} from "./delegations";
import type { Delegation } from "@delegolabs/types";

describe("lib/delegations", () => {
  describe("calculateSpendHeadroom", () => {
    it("returns calm tone when spend is below 70%", () => {
      const res = calculateSpendHeadroom(50n, 100n);
      expect(res.pct).toBe(50);
      expect(res.tone).toBe("calm");
      expect(res.isNearLimit).toBe(false);
      expect(res.headroom).toBe(50n);
    });

    it("returns amber tone when spend is between 70% and 89%", () => {
      const res = calculateSpendHeadroom(750n, 1000n);
      expect(res.pct).toBe(75);
      expect(res.tone).toBe("amber");
      expect(res.isNearLimit).toBe(false);
      expect(res.headroom).toBe(250n);
    });

    it("returns critical tone when spend is 90% or above", () => {
      const res = calculateSpendHeadroom(95n, 100n);
      expect(res.pct).toBe(95);
      expect(res.tone).toBe("critical");
      expect(res.isNearLimit).toBe(true);
      expect(res.headroom).toBe(5n);
    });

    it("handles zero cap gracefully without dividing by zero", () => {
      const res = calculateSpendHeadroom(0n, 0n);
      expect(res.pct).toBe(0);
      expect(res.tone).toBe("calm");
    });
  });

  describe("formatPeriodRollover", () => {
    it("returns default message when no expiresAt date is provided", () => {
      expect(formatPeriodRollover(null)).toBe("Period resets monthly");
      expect(formatPeriodRollover(undefined)).toBe("Period resets monthly");
    });

    it("formats relative days, hours, and minutes until rollover", () => {
      const now = new Date("2026-08-25T12:00:00Z");

      const in2Days = new Date("2026-08-27T12:00:00Z");
      expect(formatPeriodRollover(in2Days, now)).toBe("Resets in 2d");

      const in5Hours = new Date("2026-08-25T17:00:00Z");
      expect(formatPeriodRollover(in5Hours, now)).toBe("Resets in 5h");

      const in30Mins = new Date("2026-08-25T12:30:00Z");
      expect(formatPeriodRollover(in30Mins, now)).toBe("Resets in 30m");

      const past = new Date("2026-08-24T12:00:00Z");
      expect(formatPeriodRollover(past, now)).toBe("Period ended");
    });
  });

  describe("isDelegationExpired", () => {
    const baseDelegation: Delegation = {
      id: "del-1",
      userId: "u-1",
      agentId: "ag-1",
      status: "active",
      policy: {
        maxPerTransaction: 100n,
        maxTotal: 500n,
        allowedMerchants: [],
      },
      createdAt: new Date("2026-01-01"),
      updatedAt: new Date("2026-01-01"),
    };

    it("returns true if status is expired", () => {
      expect(
        isDelegationExpired({ ...baseDelegation, status: "expired" })
      ).toBe(true);
    });

    it("returns true if expiresAt is in the past", () => {
      const pastDel: Delegation = {
        ...baseDelegation,
        policy: {
          ...baseDelegation.policy,
          expiresAt: "2026-01-01T00:00:00Z",
        },
      };
      expect(
        isDelegationExpired(pastDel, new Date("2026-08-25T00:00:00Z"))
      ).toBe(true);
    });

    it("returns false if expiresAt is in the future", () => {
      const futureDel: Delegation = {
        ...baseDelegation,
        policy: {
          ...baseDelegation.policy,
          expiresAt: "2026-12-31T00:00:00Z",
        },
      };
      expect(
        isDelegationExpired(futureDel, new Date("2026-08-25T00:00:00Z"))
      ).toBe(false);
    });
  });
});
