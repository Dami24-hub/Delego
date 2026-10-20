/**
 * Unit tests for useHydrationStableBalance hook
 * Verifies hydration stability for balance and timestamp formatting
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useHydrationStableBalance, useHydrationStableTimestamp } from "./useHydrationStableBalance";

// Mock useEffect to simulate hydration lifecycle
vi.mock("react", async () => {
  const actual = await vi.importActual("react");
  return {
    ...actual,
    useEffect: (fn: () => void | (() => void)) => {
      // Simulate client-side mount after initial render
      fn();
    },
  };
});

describe("useHydrationStableBalance", () => {
  describe("basic formatting", () => {
    it("returns server placeholder before hydration", () => {
      const { result } = renderHook(() =>
        useHydrationStableBalance(1_000_000_000n)
      );

      expect(result.current.serverPlaceholder).toBeDefined();
      expect(result.current.formattedValue).toBeNull();
      expect(result.current.isHydrated).toBe(false);
    });

    it("formats XLM balance after hydration", () => {
      const { result } = renderHook(() =>
        useHydrationStableBalance(1_000_000_000n)
      );

      expect(result.current.formattedValue).toBe("100.00 XLM");
      expect(result.current.isHydrated).toBe(true);
    });

    it("handles zero balance", () => {
      const { result } = renderHook(() =>
        useHydrationStableBalance(0n)
      );

      expect(result.current.formattedValue).toBe("0.00 XLM");
    });

    it("handles string stroop amounts", () => {
      const { result } = renderHook(() =>
        useHydrationStableBalance("12345678")
      );

      expect(result.current.formattedValue).toBe("1.23 XLM");
    });
  });

  describe("decimal places", () => {
    it("respects minimumFractionDigits", () => {
      const { result } = renderHook(() =>
        useHydrationStableBalance(1n, 4)
      );

      expect(result.current.formattedValue).toBe("0.0000 XLM");
    });

    it("respects maximumFractionDigits", () => {
      const { result } = renderHook(() =>
        useHydrationStableBalance(12_345_678n, 2)
      );

      expect(result.current.formattedValue).toBe("1.23 XLM");
    });
  });

  describe("custom currency", () => {
    it("displays custom currency code", () => {
      const { result } = renderHook(() =>
        useHydrationStableBalance(1_000_000_000n, 2, "USDC")
      );

      expect(result.current.formattedValue).toBe("100.00 USDC");
    });
  });

  describe("refetch", () => {
    it("refetch recalculates formatted value", () => {
      const { result } = renderHook(() =>
        useHydrationStableBalance(1_000_000_000n)
      );

      // Initial state
      expect(result.current.formattedValue).toBe("100.00 XLM");

      // Refetch - should trigger reformatting
      act(() => {
        result.current.refetch();
      });

      expect(result.current.formattedValue).toBe("100.00 XLM");
    });
  });

  describe("null/undefined handling", () => {
    it("handles null stroopAmount", () => {
      const { result } = renderHook(() =>
        useHydrationStableBalance(null)
      );

      expect(result.current.formattedValue).toBeNull();
      expect(result.current.isHydrated).toBe(false);
    });

    it("handles undefined stroopAmount", () => {
      const { result } = renderHook(() =>
        useHydrationStableBalance(undefined)
      );

      expect(result.current.formattedValue).toBeNull();
    });
  });

  describe("large amounts", () => {
    it("handles delegation-scale amounts", () => {
      // 50,000 XLM
      const { result } = renderHook(() =>
        useHydrationStableBalance(500_000_000_000n)
      );

      expect(result.current.formattedValue).toBe("50,000.00 XLM");
    });
  });
});

describe("useHydrationStableTimestamp", () => {
  const testDate = new Date("2025-07-15T14:30:00Z");

  describe("basic formatting", () => {
    it("returns server placeholder before hydration", () => {
      const { result } = renderHook(() =>
        useHydrationStableTimestamp(testDate)
      );

      expect(result.current.serverPlaceholder).toBeDefined();
      expect(result.current.formattedValue).toBeNull();
      expect(result.current.isHydrated).toBe(false);
    });

    it("formats timestamp after hydration", () => {
      const { result } = renderHook(() =>
        useHydrationStableTimestamp(testDate)
      );

      expect(result.current.formattedValue).toBeDefined();
      expect(result.current.isHydrated).toBe(true);
    });
  });

  describe("date string handling", () => {
    it("formats ISO date string", () => {
      const { result } = renderHook(() =>
        useHydrationStableTimestamp("2025-07-15T14:30:00Z")
      );

      expect(result.current.formattedValue).toBeDefined();
      expect(result.current.isHydrated).toBe(true);
    });
  });

  describe("invalid date handling", () => {
    it("handles invalid date string", () => {
      const { result } = renderHook(() =>
        useHydrationStableTimestamp("invalid-date")
      );

      expect(result.current.formattedValue).toBeNull();
    });

    it("handles null timestamp", () => {
      const { result } = renderHook(() =>
        useHydrationStableTimestamp(null)
      );

      expect(result.current.formattedValue).toBeNull();
    });
  });

  describe("custom options", () => {
    it("applies custom date style", () => {
      const { result } = renderHook(() =>
        useHydrationStableTimestamp(testDate, { dateStyle: "full" })
      );

      expect(result.current.formattedValue).toBeDefined();
    });

    it("applies custom time style", () => {
      const { result } = renderHook(() =>
        useHydrationStableTimestamp(testDate, { timeStyle: "long" })
      );

      expect(result.current.formattedValue).toBeDefined();
    });
  });
});