"use client";

import dynamic from "next/dynamic";
import type { SpendBucket } from "../../lib/analytics";
import { isEmptySeries } from "../../lib/analytics";

export interface SpendChartProps {
  buckets: SpendBucket[];
  locale?: string;
}

/**
 * recharts is a sizeable dependency the initial bundle shouldn't pay for on
 * every route (FE-005) — dynamically imported so it lands in its own chunk,
 * fetched only when the analytics page actually renders a chart.
 */
const SpendChartInner = dynamic(() => import("./SpendChartInner"), {
  ssr: false,
  loading: () => <SpendChartSkeleton />,
});

/** Fixed-height placeholder matching the chart's rendered size, so the chunk loading in doesn't shift layout (avoids CLS). */
function SpendChartSkeleton() {
  return <div className="spend-chart-skeleton" aria-hidden="true" />;
}

export function SpendChart({ buckets, locale }: SpendChartProps) {
  if (isEmptySeries(buckets)) {
    return (
      <div className="spend-chart-empty">
        <p>No spending in the selected range.</p>
      </div>
    );
  }

  return <SpendChartInner buckets={buckets} locale={locale} />;
}
