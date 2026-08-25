import type { Order } from "@delegolabs/types";
import { needsApproval } from "./orders";

/**
 * SLA thresholds for the approval queue. Hours are measured against an
 * order's `createdAt` (stored/compared as UTC epoch millis, so these hold
 * regardless of the viewer's local timezone or clock skew of the *reader* —
 * only the server-issued `createdAt` needs to be correct).
 */
export const SLA_WARNING_HOURS = 12;
export const SLA_CRITICAL_HOURS = 48;

/** Threshold for the "waiting too long" digest hint surfaced in the notification center. */
export const STALE_DIGEST_THRESHOLD_HOURS = 24;

const MS_PER_HOUR = 3_600_000;

export type ApprovalUrgency = "normal" | "warning" | "critical";

/** Milliseconds elapsed since `createdAt`, floored at zero. */
export function getApprovalAgeMs(createdAt: Date, now: Date = new Date()): number {
  return Math.max(0, now.getTime() - createdAt.getTime());
}

/** Compact age label for a badge: "just now", "42m", "2h", "3d". */
export function formatApprovalAge(ageMs: number): string {
  const minutes = Math.floor(ageMs / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

/** Urgency bucket for an age, used to drive amber/red styling thresholds. */
export function getApprovalUrgency(
  ageMs: number,
  warningHours: number = SLA_WARNING_HOURS,
  criticalHours: number = SLA_CRITICAL_HOURS
): ApprovalUrgency {
  const hours = ageMs / MS_PER_HOUR;
  if (hours >= criticalHours) return "critical";
  if (hours >= warningHours) return "warning";
  return "normal";
}

/** Count pending-approval orders older than `thresholdHours`, for the digest hint. */
export function countStaleApprovals(
  orders: Order[],
  now: Date = new Date(),
  thresholdHours: number = STALE_DIGEST_THRESHOLD_HOURS
): number {
  const thresholdMs = thresholdHours * MS_PER_HOUR;
  return orders.filter(
    (order) => needsApproval(order) && getApprovalAgeMs(order.createdAt, now) >= thresholdMs
  ).length;
}
