/**
 * Merchant revenue series (#915). Filters settled daily metrics and formats
 * stroops for tooltips.
 */

export interface DailyRevenueMetric {
  date: string;
  grossVolumeStroops: string;
  netRevenueStroops: string;
  settledOrdersCount: number;
  feesPaidStroops: string;
}

export interface RevenueChartFilter {
  dateRange: "7d" | "30d" | "90d" | "all" | "custom";
  startDate?: string;
  endDate?: string;
  currency: string;
}

export interface PayoutLike {
  amountStroops: string;
  feeStroops: string;
  ledgerClosedAt: string;
  currency: string;
}

const DAY_MS = 86_400_000;
const STROOPS_PER_UNIT = 10_000_000n;

function parseDay(value: string | undefined): number | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return null;
  const time = Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(time) ? null : time;
}

function utcDayKey(iso: string): string | null {
  const time = Date.parse(iso);
  if (Number.isNaN(time)) return null;
  return new Date(time).toISOString().slice(0, 10);
}

function addStroops(left: string, right: string): string {
  try {
    return (BigInt(left) + BigInt(right)).toString();
  } catch {
    return left;
  }
}

export function payoutsToDailyMetrics(payouts: PayoutLike[], currency: string): DailyRevenueMetric[] {
  const wanted = currency.trim().toUpperCase();
  const byDate = new Map<string, DailyRevenueMetric>();
  for (const payout of payouts) {
    if (payout.currency.trim().toUpperCase() !== wanted) continue;
    if (!/^\d+$/.test(payout.amountStroops) || !/^\d+$/.test(payout.feeStroops)) continue;
    const date = utcDayKey(payout.ledgerClosedAt);
    if (!date) continue;
    const gross = BigInt(payout.amountStroops);
    const fees = BigInt(payout.feeStroops);
    const net = gross > fees ? gross - fees : 0n;
    const existing = byDate.get(date);
    if (!existing) {
      byDate.set(date, {
        date,
        grossVolumeStroops: gross.toString(),
        netRevenueStroops: net.toString(),
        feesPaidStroops: fees.toString(),
        settledOrdersCount: 1,
      });
      continue;
    }
    existing.grossVolumeStroops = addStroops(existing.grossVolumeStroops, gross.toString());
    existing.netRevenueStroops = addStroops(existing.netRevenueStroops, net.toString());
    existing.feesPaidStroops = addStroops(existing.feesPaidStroops, fees.toString());
    existing.settledOrdersCount += 1;
  }
  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}

export function filterRevenueMetrics(
  metrics: DailyRevenueMetric[],
  filter: RevenueChartFilter,
  now: Date = new Date()
): DailyRevenueMetric[] {
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  let start: number | null = null;
  let end: number | null = today;

  if (filter.dateRange === "7d") start = today - 6 * DAY_MS;
  else if (filter.dateRange === "30d") start = today - 29 * DAY_MS;
  else if (filter.dateRange === "90d") start = today - 89 * DAY_MS;
  else if (filter.dateRange === "all") {
    start = null;
    end = null;
  } else {
    start = parseDay(filter.startDate);
    end = parseDay(filter.endDate);
    if (start === null && end === null) return [];
    if (start !== null && end !== null && start > end) {
      const swap = start;
      start = end;
      end = swap;
    }
  }

  return metrics.filter((metric) => {
    const day = parseDay(metric.date);
    if (day === null) return false;
    if (start !== null && day < start) return false;
    if (end !== null && day > end) return false;
    return true;
  });
}

function weekStartKey(date: string): string {
  const day = parseDay(date);
  if (day === null) return date;
  const dow = new Date(day).getUTCDay();
  const delta = dow === 0 ? 6 : dow - 1;
  return new Date(day - delta * DAY_MS).toISOString().slice(0, 10);
}

export function bucketWeekly(metrics: DailyRevenueMetric[]): DailyRevenueMetric[] {
  const weeks = new Map<string, DailyRevenueMetric>();
  for (const metric of metrics) {
    const key = weekStartKey(metric.date);
    const existing = weeks.get(key);
    if (!existing) {
      weeks.set(key, { ...metric, date: key });
      continue;
    }
    existing.grossVolumeStroops = addStroops(existing.grossVolumeStroops, metric.grossVolumeStroops);
    existing.netRevenueStroops = addStroops(existing.netRevenueStroops, metric.netRevenueStroops);
    existing.feesPaidStroops = addStroops(existing.feesPaidStroops, metric.feesPaidStroops);
    existing.settledOrdersCount += metric.settledOrdersCount;
  }
  return [...weeks.values()].sort((a, b) => a.date.localeCompare(b.date));
}

export function formatStroopsAmount(stroops: string, currency: string, locale = "en-US"): string {
  let raw: bigint;
  try {
    raw = BigInt(stroops);
  } catch {
    raw = 0n;
  }
  const negative = raw < 0n;
  const abs = negative ? -raw : raw;
  const cents = (abs + 50_000n) / 100_000n;
  const whole = cents / 100n;
  const fraction = (cents % 100n).toString().padStart(2, "0");
  return `${negative ? "-" : ""}${whole.toLocaleString(locale)}.${fraction} ${currency}`;
}

export function formatRevenueTooltip(metric: DailyRevenueMetric, currency: string) {
  return {
    date: metric.date,
    gross: formatStroopsAmount(metric.grossVolumeStroops, currency),
    net: formatStroopsAmount(metric.netRevenueStroops, currency),
    orders: metric.settledOrdersCount,
  };
}

export interface ChartPoint {
  x: number;
  y: number;
}

/** Cardinal spline through points, used for the area and line series. */
export function smoothLinePath(points: ChartPoint[]): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  let path = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    path += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
  }
  return path;
}

export function smoothAreaPath(points: ChartPoint[], baselineY: number): string {
  if (points.length === 0) return "";
  const last = points[points.length - 1];
  const first = points[0];
  return `${smoothLinePath(points)} L ${last.x} ${baselineY} L ${first.x} ${baselineY} Z`;
}

export function stroopsToNumber(value: string): number {
  try {
    const raw = BigInt(value);
    return Number(raw) / Number(STROOPS_PER_UNIT);
  } catch {
    return 0;
  }
}
