"use client";

import { useId, useMemo, useState } from "react";
import type { PayoutRecord } from "../../lib/merchantPayouts";
import {
  bucketWeekly,
  filterRevenueMetrics,
  formatRevenueTooltip,
  formatStroopsAmount,
  payoutsToDailyMetrics,
  smoothAreaPath,
  smoothLinePath,
  stroopsToNumber,
  type ChartPoint,
  type RevenueChartFilter,
} from "../../lib/revenueChart";

const PRESETS: Array<{ id: RevenueChartFilter["dateRange"]; label: string }> = [
  { id: "7d", label: "7D" },
  { id: "30d", label: "30D" },
  { id: "90d", label: "90D" },
  { id: "all", label: "All" },
];

const WIDTH = 640;
const HEIGHT = 240;
const PAD = { top: 16, right: 12, bottom: 28, left: 36 };

export function RevenueAreaChart({ payouts }: { payouts: PayoutRecord[] }) {
  const gradientId = useId().replace(/:/g, "");
  const currencies = useMemo(() => {
    const found = [...new Set(payouts.map((payout) => payout.currency).filter(Boolean))];
    return found.length > 0 ? found : ["USDC"];
  }, [payouts]);
  const [currency, setCurrency] = useState(currencies[0]);
  const [dateRange, setDateRange] = useState<RevenueChartFilter["dateRange"]>("30d");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [grain, setGrain] = useState<"day" | "week">("day");
  const [hover, setHover] = useState<number | null>(null);

  const activeCurrency = currencies.includes(currency) ? currency : currencies[0];

  const series = useMemo(() => {
    const filter: RevenueChartFilter = {
      dateRange,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      currency: activeCurrency,
    };
    const daily = filterRevenueMetrics(payoutsToDailyMetrics(payouts, activeCurrency), filter);
    return grain === "week" ? bucketWeekly(daily) : daily;
  }, [payouts, activeCurrency, dateRange, startDate, endDate, grain]);

  const layout = useMemo(() => {
    const plotW = WIDTH - PAD.left - PAD.right;
    const plotH = HEIGHT - PAD.top - PAD.bottom;
    const max = Math.max(1, ...series.map((row) => stroopsToNumber(row.grossVolumeStroops)));
    const points = series.map((row, index) => {
      const x = PAD.left + (series.length === 1 ? plotW / 2 : (index / (series.length - 1)) * plotW);
      const yFor = (stroops: string) => PAD.top + plotH - (stroopsToNumber(stroops) / max) * plotH;
      return { row, x, grossY: yFor(row.grossVolumeStroops), netY: yFor(row.netRevenueStroops), feeY: yFor(row.feesPaidStroops) };
    });
    const baseline = PAD.top + plotH;
    const gross: ChartPoint[] = points.map((point) => ({ x: point.x, y: point.grossY }));
    const net: ChartPoint[] = points.map((point) => ({ x: point.x, y: point.netY }));
    const fees: ChartPoint[] = points.map((point) => ({ x: point.x, y: point.feeY }));
    return { points, baseline, gross, net, fees };
  }, [series]);

  const active = hover !== null ? layout.points[hover] : null;
  const tooltip = active ? formatRevenueTooltip(active.row, activeCurrency) : null;

  function nearest(clientX: number, bounds: DOMRect) {
    if (layout.points.length === 0) return;
    const x = ((clientX - bounds.left) / bounds.width) * WIDTH;
    let best = 0;
    let bestDist = Infinity;
    layout.points.forEach((point, index) => {
      const dist = Math.abs(point.x - x);
      if (dist < bestDist) {
        best = index;
        bestDist = dist;
      }
    });
    setHover(best);
  }

  return (
    <section aria-label="Merchant revenue" style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center" }}>
        {PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            aria-pressed={dateRange === preset.id}
            onClick={() => setDateRange(preset.id)}
            style={{
              padding: "0.25rem 0.625rem",
              borderRadius: "999px",
              border: "1px solid #d1d5db",
              background: dateRange === preset.id ? "#111827" : "#fff",
              color: dateRange === preset.id ? "#fff" : "#111827",
              cursor: "pointer",
              fontSize: "0.75rem",
              fontWeight: 700,
            }}
          >
            {preset.label}
          </button>
        ))}
        <label style={{ fontSize: "0.75rem" }}>
          From
          <input
            type="date"
            aria-label="Custom start date"
            value={startDate}
            onChange={(event) => {
              setStartDate(event.target.value);
              setDateRange("custom");
            }}
            style={{ marginLeft: "0.25rem" }}
          />
        </label>
        <label style={{ fontSize: "0.75rem" }}>
          To
          <input
            type="date"
            aria-label="Custom end date"
            value={endDate}
            onChange={(event) => {
              setEndDate(event.target.value);
              setDateRange("custom");
            }}
            style={{ marginLeft: "0.25rem" }}
          />
        </label>
        <button type="button" aria-pressed={grain === "day"} onClick={() => setGrain("day")}>
          Daily
        </button>
        <button type="button" aria-pressed={grain === "week"} onClick={() => setGrain("week")}>
          Weekly
        </button>
        <label style={{ fontSize: "0.75rem" }}>
          Currency
          <select
            aria-label="Revenue currency"
            value={activeCurrency}
            onChange={(event) => setCurrency(event.target.value)}
            style={{ marginLeft: "0.25rem" }}
          >
            {currencies.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>
        </label>
      </div>

      {series.length === 0 ? (
        <p style={{ color: "#6b7280", fontSize: "0.875rem" }}>No settled revenue in this range.</p>
      ) : (
        <div style={{ position: "relative" }}>
          <svg
            role="img"
            aria-label={`Revenue chart for ${activeCurrency}`}
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            width="100%"
            height="240"
            onMouseMove={(event) => nearest(event.clientX, event.currentTarget.getBoundingClientRect())}
            onMouseLeave={() => setHover(null)}
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2563eb" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#2563eb" stopOpacity="0.02" />
              </linearGradient>
            </defs>
            <path d={smoothAreaPath(layout.gross, layout.baseline)} fill={`url(#${gradientId})`} />
            <path d={smoothLinePath(layout.gross)} fill="none" stroke="#2563eb" strokeWidth="2" />
            <path d={smoothLinePath(layout.net)} fill="none" stroke="#059669" strokeWidth="2" />
            <path d={smoothLinePath(layout.fees)} fill="none" stroke="#d97706" strokeWidth="2" strokeDasharray="4 3" />
            {active && (
              <circle cx={active.x} cy={active.netY} r="4" fill="#059669" />
            )}
          </svg>
          {tooltip && active && (
            <div
              role="tooltip"
              style={{
                position: "absolute",
                left: `${(active.x / WIDTH) * 100}%`,
                top: 8,
                transform: "translateX(-50%)",
                background: "#111827",
                color: "#fff",
                borderRadius: "0.5rem",
                padding: "0.5rem 0.625rem",
                fontSize: "0.75rem",
                pointerEvents: "none",
                whiteSpace: "nowrap",
              }}
            >
              <div>{tooltip.date}</div>
              <div>Gross {tooltip.gross}</div>
              <div>Net {tooltip.net}</div>
              <div>{tooltip.orders} orders</div>
            </div>
          )}
        </div>
      )}

      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.75rem" }}>
        <caption style={{ textAlign: "left", fontWeight: 700, marginBottom: "0.25rem" }}>
          Revenue data
        </caption>
        <thead>
          <tr>
            <th style={{ textAlign: "left" }}>Date</th>
            <th style={{ textAlign: "left" }}>Gross</th>
            <th style={{ textAlign: "left" }}>Net</th>
            <th style={{ textAlign: "left" }}>Fees</th>
            <th style={{ textAlign: "left" }}>Orders</th>
          </tr>
        </thead>
        <tbody>
          {series.map((row) => (
            <tr key={row.date}>
              <th scope="row" style={{ textAlign: "left", fontWeight: 500 }}>
                {row.date}
              </th>
              <td>{formatStroopsAmount(row.grossVolumeStroops, activeCurrency)}</td>
              <td>{formatStroopsAmount(row.netRevenueStroops, activeCurrency)}</td>
              <td>{formatStroopsAmount(row.feesPaidStroops, activeCurrency)}</td>
              <td>{row.settledOrdersCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
