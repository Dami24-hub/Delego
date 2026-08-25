"use client";

import { useNow } from "../../hooks/useNow";
import {
  SLA_CRITICAL_HOURS,
  SLA_WARNING_HOURS,
  formatApprovalAge,
  getApprovalAgeMs,
  getApprovalUrgency,
} from "../../lib/approvals";

export interface ApprovalAgeBadgeProps {
  createdAt: Date;
  warningHours?: number;
  criticalHours?: number;
  /** How often the badge re-renders to keep the age fresh (ms). Default 1 minute. */
  refreshMs?: number;
}

/** Live-updating "how long has this been waiting" badge, amber/red past SLA thresholds. */
export function ApprovalAgeBadge({
  createdAt,
  warningHours = SLA_WARNING_HOURS,
  criticalHours = SLA_CRITICAL_HOURS,
  refreshMs = 60_000,
}: ApprovalAgeBadgeProps) {
  const now = useNow(refreshMs);
  const ageMs = getApprovalAgeMs(createdAt, now);
  const urgency = getApprovalUrgency(ageMs, warningHours, criticalHours);

  return (
    <span
      className={`approval-age-badge approval-age-${urgency}`}
      title={`Waiting since ${createdAt.toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      })}`}
    >
      {formatApprovalAge(ageMs)}
    </span>
  );
}
