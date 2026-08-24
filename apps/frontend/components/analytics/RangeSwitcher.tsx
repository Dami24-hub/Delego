"use client";

import { ANALYTICS_RANGES, type AnalyticsRange } from "../../lib/analytics";

const RANGE_LABEL: Record<AnalyticsRange, string> = {
  "7d": "7D",
  "30d": "30D",
  "90d": "90D",
};

export interface RangeSwitcherProps {
  value: AnalyticsRange;
  onChange: (range: AnalyticsRange) => void;
}

/** 7D/30D/90D toggle for the spend chart — the active range is persisted in the URL by the caller (see app/analytics/page.tsx). */
export function RangeSwitcher({ value, onChange }: RangeSwitcherProps) {
  return (
    <div className="range-switcher" role="group" aria-label="Date range">
      {ANALYTICS_RANGES.map((range) => (
        <button
          key={range}
          type="button"
          className={`range-switcher-option${range === value ? " active" : ""}`}
          aria-pressed={range === value}
          onClick={() => onChange(range)}
        >
          {RANGE_LABEL[range]}
        </button>
      ))}
    </div>
  );
}
