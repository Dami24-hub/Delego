/**
 * HydrationStableBalance
 *
 * Renders balance amounts without React hydration mismatch warnings.
 * Uses a two-pass approach: skeleton placeholder on server, formatted value on client.
 *
 * Problem: Server-side rendering uses default locale while client uses user's locale,
 * causing text content mismatches (e.g. "100.00" vs "100,00").
 *
 * Solution: Render stable skeleton on server, then format with user locale after mount.
 * See useHydrationStableBalance hook for implementation details.
 */

"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";

interface HydrationStableBalanceProps {
  /** Amount in stroops (BigInt or string) */
  stroopAmount: bigint | string;
  /** Number of decimal places (default: 2 for XLM) */
  decimals?: number;
  /** Currency code to display (default: "XLM") */
  currencyCode?: string;
  /** Optional className for styling */
  className?: string;
  /** Optional fallback when amount is null/undefined */
  fallback?: ReactNode;
}

/**
 * Skeleton placeholder component for initial server render.
 * Uses aria attributes for accessibility during loading state.
 */
function SkeletonPlaceholder({ className }: { className?: string }) {
  return (
    <span
      aria-busy="true"
      aria-live="polite"
      className={className}
      style={{
        // Use inline style to avoid CSS class mismatches
        display: "inline-block",
        minWidth: "2ch",
        opacity: 0.6,
      }}
    >
      {/* Non-breaking space maintains layout without hydration risk */}
      {"\u00A0"}
    </span>
  );
}

/**
 * Formatted balance component with hydration stability.
 * 
 * @example
 * <HydrationStableBalance stroopAmount={1_000_000_000n} />
 * // Renders: 100.00 XLM (after hydration)
 *
 * @example
 * <HydrationStableBalance stroopAmount="12345678" decimals={4} currencyCode="USDC" />
 * // Renders: 1.2346 USDC (after hydration)
 */
export function HydrationStableBalance({
  stroopAmount,
  decimals = 2,
  currencyCode = "XLM",
  className,
  fallback = null,
}: HydrationStableBalanceProps) {
  const [isHydrated, setIsHydrated] = useState(false);
  const [formattedValue, setFormattedValue] = useState<string | null>(null);

  // Format after client mounts to avoid hydration mismatch
  useEffect(() => {
    if (stroopAmount == null) {
      setFormattedValue(null);
      return;
    }

    try {
      const amount = typeof stroopAmount === "string" ? BigInt(stroopAmount) : stroopAmount;
      const STROOPS_PER_XLM = 10_000_000n;
      const xlm = Number(amount) / Number(STROOPS_PER_XLM);

      const formatted = xlm.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });

      setFormattedValue(`${formatted} ${currencyCode}`);
      setIsHydrated(true);
    } catch {
      setFormattedValue(null);
    }
  }, [stroopAmount, decimals, currencyCode]);

  // Show skeleton during initial render (server and first client render)
  if (!isHydrated) {
    return <SkeletonPlaceholder className={className} />;
  }

  // Show formatted value after hydration
  if (formattedValue == null) {
    return <>{fallback ?? ""}</>;
  }

  return <span className={className}>{formattedValue}</span>;
}

/**
 * Hydration-stable timestamp component.
 * Uses skeleton placeholder until client-side formatting.
 */
interface HydrationStableTimestampProps {
  /** Date to format (Date object or ISO string) */
  timestamp: Date | string;
  /** Optional date style */
  dateStyle?: "full" | "long" | "medium" | "short";
  /** Optional time style */
  timeStyle?: "full" | "long" | "medium" | "short";
  /** Optional className for styling */
  className?: string;
  /** Optional fallback when timestamp is invalid */
  fallback?: ReactNode;
}

export function HydrationStableTimestamp({
  timestamp,
  dateStyle = "medium",
  timeStyle = "short",
  className,
  fallback = null,
}: HydrationStableTimestampProps) {
  const [isHydrated, setIsHydrated] = useState(false);
  const [formattedValue, setFormattedValue] = useState<string | null>(null);

  useEffect(() => {
    if (timestamp == null) {
      setFormattedValue(null);
      return;
    }

    try {
      const date = typeof timestamp === "string" ? new Date(timestamp) : timestamp;

      if (Number.isNaN(date.getTime())) {
        setFormattedValue(null);
        return;
      }

      const formatted = date.toLocaleString(undefined, {
        dateStyle,
        timeStyle,
      });

      setFormattedValue(formatted);
      setIsHydrated(true);
    } catch {
      setFormattedValue(null);
    }
  }, [timestamp, dateStyle, timeStyle]);

  // Show skeleton during initial render
  if (!isHydrated) {
    return <SkeletonPlaceholder className={className} />;
  }

  // Show formatted value after hydration
  if (formattedValue == null) {
    return <>{fallback ?? ""}</>;
  }

  return <time dateTime={typeof timestamp === "string" ? timestamp : timestamp.toISOString()} className={className}>{formattedValue}</time>;
}