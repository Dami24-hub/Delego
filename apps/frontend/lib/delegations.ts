import type { Delegation } from "@delegolabs/types";

export type SpendUsageTone = "calm" | "amber" | "critical";

export interface SpendHeadroom {
  pct: number;
  spent: bigint;
  cap: bigint;
  headroom: bigint;
  tone: SpendUsageTone;
  isNearLimit: boolean;
}

/** Compute spend usage percentage, remaining headroom, and status tone. */
export function calculateSpendHeadroom(spent: bigint | number, cap: bigint | number): SpendHeadroom {
  const spentBig = typeof spent === "number" ? BigInt(Math.max(0, Math.floor(spent))) : spent;
  const capBig = typeof cap === "number" ? BigInt(Math.max(1, Math.floor(cap))) : cap;

  const validCap = capBig <= 0n ? 1n : capBig;
  const validSpent = spentBig < 0n ? 0n : spentBig;

  const headroom = validCap > validSpent ? validCap - validSpent : 0n;
  const pct = Math.min(100, Math.max(0, Number((validSpent * 100n) / validCap)));

  let tone: SpendUsageTone = "calm";
  if (pct >= 90) {
    tone = "critical";
  } else if (pct >= 70) {
    tone = "amber";
  }

  return {
    pct,
    spent: validSpent,
    cap: validCap,
    headroom,
    tone,
    isNearLimit: pct >= 90,
  };
}

/** Format human-readable period rollover countdown string. */
export function formatPeriodRollover(
  expiresAt: Date | string | null | undefined,
  now: Date = new Date()
): string {
  if (!expiresAt) {
    return "Period resets monthly";
  }

  const rolloverDate = typeof expiresAt === "string" ? new Date(expiresAt) : expiresAt;
  if (isNaN(rolloverDate.getTime())) {
    return "Period resets monthly";
  }

  const diffMs = rolloverDate.getTime() - now.getTime();
  if (diffMs <= 0) {
    return "Period ended";
  }

  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  if (diffMinutes < 60) {
    return `Resets in ${diffMinutes}m`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `Resets in ${diffHours}h`;
  }

  const diffDays = Math.floor(diffHours / 24);
  return `Resets in ${diffDays}d`;
}

/** Check if delegation expiry date is past. */
export function isDelegationExpired(delegation: Delegation, now: Date = new Date()): boolean {
  if (delegation.status === "expired") return true;
  if (!delegation.policy?.expiresAt) return false;

  const exp = new Date(delegation.policy.expiresAt);
  return !isNaN(exp.getTime()) && exp.getTime() <= now.getTime();
}
