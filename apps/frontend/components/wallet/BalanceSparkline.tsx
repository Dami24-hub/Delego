/**
 * BalanceSparkline Component
 *
 * Renders an inline, dependency-light SVG sparkline displaying balance history.
 * Displays a graceful dashed placeholder when history is empty or flat/insufficient.
 */

"use client";

import { useMemo, useState } from "react";
import type { BalancePoint } from "../../hooks/useBalanceHistory";

export interface BalanceSparklineProps {
  series: BalancePoint[];
  width?: number;
  height?: number;
  className?: string;
}

export function BalanceSparkline({
  series,
  width = 500,
  height = 120,
  className = "",
}: BalanceSparklineProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const padding = { top: 16, bottom: 24, left: 16, right: 16 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  const pointsData = useMemo(() => {
    if (!series || series.length < 2) return null;

    const values = series.map((s) => s.balance);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const valRange = maxVal - minVal || 1; // avoid division by zero

    const points = series.map((pt, i) => {
      const x = padding.left + (i / (series.length - 1)) * innerWidth;
      const y =
        maxVal === minVal
          ? padding.top + innerHeight / 2
          : padding.top +
            innerHeight -
            ((pt.balance - minVal) / valRange) * innerHeight;
      return { x, y, date: pt.date, balance: pt.balance };
    });

    const pathD = points.reduce((acc, pt, i) => {
      return `${acc} ${i === 0 ? "M" : "L"} ${pt.x.toFixed(2)} ${pt.y.toFixed(2)}`;
    }, "");

    const areaD = `${pathD} L ${points[points.length - 1].x.toFixed(2)} ${(padding.top + innerHeight).toFixed(2)} L ${points[0].x.toFixed(2)} ${(padding.top + innerHeight).toFixed(2)} Z`;

    return { points, pathD, areaD, minVal, maxVal };
  }, [series, innerWidth, innerHeight, padding.left, padding.top]);

  if (!pointsData) {
    return (
      <div
        className={`sparkline-empty ${className}`}
        role="img"
        aria-label="No historical balance data available"
      >
        <svg
          viewBox={`0 0 ${width} ${height}`}
          width="100%"
          height={height}
          preserveAspectRatio="none"
        >
          <line
            x1={padding.left}
            y1={height / 2}
            x2={width - padding.right}
            y2={height / 2}
            stroke="var(--color-border)"
            strokeDasharray="4 4"
            strokeWidth="1.5"
          />
        </svg>
        <span className="sparkline-empty-text">
          No balance history available
        </span>
      </div>
    );
  }

  const { points, pathD, areaD } = pointsData;
  const lastPt = points[points.length - 1];
  const activePt = hoverIndex !== null ? points[hoverIndex] : lastPt;

  return (
    <div className={`sparkline-container ${className}`}>
      <div className="sparkline-header">
        <span className="sparkline-title">30-Day XLM History</span>
        {activePt && (
          <span className="sparkline-badge">
            <span className="sparkline-date">{activePt.date}</span>:{" "}
            <strong>
              {activePt.balance.toLocaleString(undefined, {
                maximumFractionDigits: 4,
              })}{" "}
              XLM
            </strong>
          </span>
        )}
      </div>

      <div className="sparkline-svg-wrap">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          width="100%"
          height={height}
          className="sparkline-svg"
          onMouseLeave={() => setHoverIndex(null)}
        >
          <defs>
            <linearGradient id="sparkline-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor="var(--color-accent)"
                stopOpacity="0.25"
              />
              <stop
                offset="100%"
                stopColor="var(--color-accent)"
                stopOpacity="0.0"
              />
            </linearGradient>
          </defs>

          {/* Area Fill */}
          <path d={areaD} fill="url(#sparkline-gradient)" />

          {/* Line Path */}
          <path
            d={pathD}
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Points & Hover overlays */}
          {points.map((pt, idx) => (
            <circle
              key={pt.date + idx}
              cx={pt.x}
              cy={pt.y}
              r={hoverIndex === idx ? 5 : idx === points.length - 1 ? 4 : 0}
              fill={
                hoverIndex === idx
                  ? "var(--color-bg-surface)"
                  : "var(--color-accent)"
              }
              stroke="var(--color-accent)"
              strokeWidth={hoverIndex === idx ? 2.5 : 0}
              style={{ transition: "r 0.15s ease" }}
            />
          ))}

          {/* Invisible interactive hover targets */}
          {points.map((pt, idx) => (
            <rect
              key={"hover-" + idx}
              x={pt.x - innerWidth / (points.length * 2)}
              y={0}
              width={innerWidth / points.length}
              height={height}
              fill="transparent"
              onMouseEnter={() => setHoverIndex(idx)}
            />
          ))}
        </svg>
      </div>
    </div>
  );
}
