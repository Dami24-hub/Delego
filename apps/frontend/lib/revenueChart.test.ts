import { describe, expect, it } from "vitest";
import {
  bucketWeekly,
  filterRevenueMetrics,
  formatRevenueTooltip,
  formatStroopsAmount,
  payoutsToDailyMetrics,
  smoothLinePath,
} from "./revenueChart";

const NOW = new Date("2026-10-18T12:00:00Z");

function metric(date: string, gross = "10000000"): {
  date: string;
  grossVolumeStroops: string;
  netRevenueStroops: string;
  settledOrdersCount: number;
  feesPaidStroops: string;
} {
  return {
    date,
    grossVolumeStroops: gross,
    netRevenueStroops: gross,
    feesPaidStroops: "0",
    settledOrdersCount: 1,
  };
}

describe("filterRevenueMetrics", () => {
  const metrics = [metric("2026-10-01"), metric("2026-10-12"), metric("2026-10-18")];

  it("keeps the trailing window for presets", () => {
    const days = filterRevenueMetrics(metrics, { dateRange: "7d", currency: "USDC" }, NOW).map(
      (row) => row.date
    );
    expect(days).toEqual(["2026-10-12", "2026-10-18"]);
  });

  it("uses an inclusive custom range and swaps inverted dates", () => {
    const days = filterRevenueMetrics(
      metrics,
      { dateRange: "custom", startDate: "2026-10-18", endDate: "2026-10-12", currency: "XLM" },
      NOW
    ).map((row) => row.date);
    expect(days).toEqual(["2026-10-12", "2026-10-18"]);
  });

  it("returns nothing for a custom filter with no dates", () => {
    expect(
      filterRevenueMetrics(metrics, { dateRange: "custom", currency: "USDC" }, NOW)
    ).toEqual([]);
  });
});

describe("payouts and formatting", () => {
  it("aggregates one currency into daily gross, net, fees, and order count", () => {
    const rows = payoutsToDailyMetrics(
      [
        {
          amountStroops: "20000000",
          feeStroops: "1000000",
          ledgerClosedAt: "2026-10-18T01:00:00Z",
          currency: "usdc",
        },
        {
          amountStroops: "5000000",
          feeStroops: "0",
          ledgerClosedAt: "2026-10-18T05:00:00Z",
          currency: "USDC",
        },
        {
          amountStroops: "9000000",
          feeStroops: "0",
          ledgerClosedAt: "2026-10-18T05:00:00Z",
          currency: "XLM",
        },
      ],
      "USDC"
    );
    expect(rows).toEqual([
      {
        date: "2026-10-18",
        grossVolumeStroops: "25000000",
        netRevenueStroops: "24000000",
        feesPaidStroops: "1000000",
        settledOrdersCount: 2,
      },
    ]);
  });

  it("formats stroops with grouped currency units", () => {
    expect(formatStroopsAmount("12345678900", "XLM")).toBe("1,234.57 XLM");
    expect(formatStroopsAmount("100000000000", "USDC")).toBe("10,000.00 USDC");
    const tip = formatRevenueTooltip(metric("2026-10-18", "10000000"), "USDC");
    expect(tip).toEqual({ date: "2026-10-18", gross: "1.00 USDC", net: "1.00 USDC", orders: 1 });
  });

  it("rolls days into the Monday of their week", () => {
    const weeks = bucketWeekly([metric("2026-10-12"), metric("2026-10-14"), metric("2026-10-19")]);
    expect(weeks.map((week) => week.date)).toEqual(["2026-10-12", "2026-10-19"]);
    expect(weeks[0].settledOrdersCount).toBe(2);
  });
});

describe("smoothLinePath", () => {
  it("starts at the first point and curves toward the next", () => {
    const path = smoothLinePath([
      { x: 0, y: 10 },
      { x: 10, y: 0 },
    ]);
    expect(path.startsWith("M 0 10")).toBe(true);
    expect(path).toContain("C");
  });
});
