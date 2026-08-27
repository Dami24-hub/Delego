"use client";

import { Amount, Button } from "@delegolabs/ui";
import {
  calculateSpendHeadroom,
  formatPeriodRollover,
} from "../../lib/delegations";
import { useCurrency } from "../../hooks/useCurrency";

export interface SpendLedgerEntry {
  id: string;
  amount: bigint;
  merchant: string;
  timestamp: Date | string;
}

export interface LimitUsageBarProps {
  spent: bigint | number;
  cap: bigint | number;
  periodRollover?: Date | string | null;
  density?: "compact" | "expanded";
  ledgerEntries?: SpendLedgerEntry[];
  onTightenApproval?: () => void;
}

export function LimitUsageBar({
  spent,
  cap,
  periodRollover,
  density = "compact",
  ledgerEntries = [],
  onTightenApproval,
}: LimitUsageBarProps) {
  const { currencyId, rate } = useCurrency();
  const headroomInfo = calculateSpendHeadroom(spent, cap);
  const rolloverText = formatPeriodRollover(periodRollover);

  const toneColorMap = {
    calm: {
      bar: "var(--color-success, #10b981)",
      badge: "var(--color-success-subtle, #d1fae5)",
      text: "#065f46",
    },
    amber: {
      bar: "var(--color-warning, #f59e0b)",
      badge: "var(--color-warning-subtle, #fef3c7)",
      text: "#92400e",
    },
    critical: {
      bar: "var(--color-danger, #ef4444)",
      badge: "var(--color-danger-subtle, #fee2e2)",
      text: "#991b1b",
    },
  };

  const currentTheme = toneColorMap[headroomInfo.tone];

  if (density === "compact") {
    return (
      <div
        className="limit-usage-bar compact"
        style={{ marginTop: "0.75rem", marginBottom: "0.75rem" }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "0.8125rem",
            marginBottom: "0.375rem",
          }}
        >
          <span
            style={{
              fontWeight: 500,
              color: "var(--color-text-muted, #6b7280)",
            }}
          >
            Period Spending ({headroomInfo.pct}%)
          </span>
          <span
            style={{
              fontSize: "0.75rem",
              color: "var(--color-text-subtle, #9ca3af)",
            }}
          >
            {rolloverText}
          </span>
        </div>

        {/* Outer Bar */}
        <div
          role="progressbar"
          aria-valuenow={headroomInfo.pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Spending policy usage ${headroomInfo.pct}%`}
          style={{
            height: "0.5rem",
            width: "100%",
            backgroundColor: "var(--color-bg-subtle, #e5e7eb)",
            borderRadius: "9999px",
            overflow: "hidden",
          }}
        >
          {/* Inner Fill */}
          <div
            style={{
              height: "100%",
              width: `${headroomInfo.pct}%`,
              backgroundColor: currentTheme.bar,
              borderRadius: "9999px",
              transition: "width 0.3s ease-in-out",
            }}
          />
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: "0.75rem",
            marginTop: "0.375rem",
            color: "var(--color-text-muted, #6b7280)",
          }}
        >
          <span>
            Spent:{" "}
            <Amount
              stroops={headroomInfo.spent}
              currency={currencyId}
              xlmUsdRate={rate?.xlmUsdRate}
            />
          </span>
          <span>
            Cap:{" "}
            <Amount
              stroops={headroomInfo.cap}
              currency={currencyId}
              xlmUsdRate={rate?.xlmUsdRate}
            />
          </span>
        </div>
      </div>
    );
  }

  // Expanded View for Delegation Detail Page
  return (
    <div
      className="limit-usage-bar expanded"
      style={{
        padding: "1.25rem",
        borderRadius: "0.75rem",
        backgroundColor: "var(--color-bg-card, #ffffff)",
        border: "1px solid var(--color-border, #e5e7eb)",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
        marginBottom: "1.5rem",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "0.75rem",
        }}
      >
        <div>
          <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 600 }}>
            Spending Policy Headroom
          </h3>
          <p
            style={{
              margin: "0.25rem 0 0 0",
              fontSize: "0.875rem",
              color: "var(--color-text-muted, #6b7280)",
            }}
          >
            {rolloverText}
          </p>
        </div>
        <span
          style={{
            padding: "0.25rem 0.625rem",
            borderRadius: "9999px",
            fontSize: "0.75rem",
            fontWeight: 600,
            backgroundColor: currentTheme.badge,
            color: currentTheme.text,
          }}
        >
          {headroomInfo.pct}% Used
        </span>
      </div>

      {/* Progress Bar */}
      <div
        role="progressbar"
        aria-valuenow={headroomInfo.pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Spending policy headroom ${headroomInfo.pct}%`}
        style={{
          height: "0.75rem",
          width: "100%",
          backgroundColor: "var(--color-bg-subtle, #e5e7eb)",
          borderRadius: "9999px",
          overflow: "hidden",
          margin: "1rem 0",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${headroomInfo.pct}%`,
            backgroundColor: currentTheme.bar,
            borderRadius: "9999px",
            transition: "width 0.3s ease-in-out",
          }}
        />
      </div>

      {/* Detail Headroom Numbers */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "1rem",
          marginTop: "1rem",
          paddingTop: "1rem",
          borderTop: "1px dashed var(--color-border, #e5e7eb)",
        }}
      >
        <div>
          <span
            style={{
              display: "block",
              fontSize: "0.75rem",
              color: "var(--color-text-muted, #6b7280)",
            }}
          >
            Spent
          </span>
          <strong
            style={{
              fontSize: "1rem",
              color: "var(--color-text-main, #111827)",
            }}
          >
            <Amount
              stroops={headroomInfo.spent}
              currency={currencyId}
              xlmUsdRate={rate?.xlmUsdRate}
            />
          </strong>
        </div>
        <div>
          <span
            style={{
              display: "block",
              fontSize: "0.75rem",
              color: "var(--color-text-muted, #6b7280)",
            }}
          >
            Remaining Headroom
          </span>
          <strong style={{ fontSize: "1rem", color: currentTheme.text }}>
            <Amount
              stroops={headroomInfo.headroom}
              currency={currencyId}
              xlmUsdRate={rate?.xlmUsdRate}
            />
          </strong>
        </div>
        <div>
          <span
            style={{
              display: "block",
              fontSize: "0.75rem",
              color: "var(--color-text-muted, #6b7280)",
            }}
          >
            Period Cap
          </span>
          <strong
            style={{
              fontSize: "1rem",
              color: "var(--color-text-main, #111827)",
            }}
          >
            <Amount
              stroops={headroomInfo.cap}
              currency={currencyId}
              xlmUsdRate={rate?.xlmUsdRate}
            />
          </strong>
        </div>
      </div>

      {/* Near-Limit Suggestion Banner */}
      {headroomInfo.isNearLimit && (
        <div
          style={{
            marginTop: "1.25rem",
            padding: "0.875rem",
            borderRadius: "0.5rem",
            backgroundColor: "var(--color-danger-subtle, #fee2e2)",
            border: "1px solid var(--color-danger, #ef4444)",
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span role="img" aria-label="warning">
              ⚠️
            </span>
            <strong style={{ fontSize: "0.875rem", color: "#991b1b" }}>
              Near Spend Limit ({headroomInfo.pct}% Used)
            </strong>
          </div>
          <p style={{ margin: 0, fontSize: "0.8125rem", color: "#7f1d1d" }}>
            This agent is approaching its period limit. Enable or tighten the
            approval threshold to prevent unexpected order rejections.
          </p>
          {onTightenApproval && (
            <div style={{ marginTop: "0.25rem" }}>
              <Button
                variant="secondary"
                onClick={onTightenApproval}
                style={{ fontSize: "0.8125rem", padding: "0.25rem 0.75rem" }}
              >
                Tighten Approval Threshold
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Spend Ledger History Table */}
      {ledgerEntries.length > 0 && (
        <div style={{ marginTop: "1.5rem" }}>
          <h4
            style={{
              fontSize: "0.875rem",
              fontWeight: 600,
              marginBottom: "0.5rem",
            }}
          >
            Recent Spend Ledger
          </h4>
          <table
            style={{
              width: "100%",
              fontSize: "0.8125rem",
              borderCollapse: "collapse",
            }}
          >
            <thead>
              <tr
                style={{
                  borderBottom: "1px solid var(--color-border, #e5e7eb)",
                  textAlign: "left",
                  color: "var(--color-text-muted, #6b7280)",
                }}
              >
                <th style={{ padding: "0.375rem 0" }}>Merchant</th>
                <th style={{ padding: "0.375rem 0" }}>Amount</th>
                <th style={{ padding: "0.375rem 0" }}>Date</th>
              </tr>
            </thead>
            <tbody>
              {ledgerEntries.map((entry) => (
                <tr
                  key={entry.id}
                  style={{
                    borderBottom: "1px solid var(--color-bg-subtle, #f3f4f6)",
                  }}
                >
                  <td style={{ padding: "0.375rem 0" }}>{entry.merchant}</td>
                  <td style={{ padding: "0.375rem 0" }}>
                    <Amount
                      stroops={entry.amount}
                      currency={currencyId}
                      xlmUsdRate={rate?.xlmUsdRate}
                    />
                  </td>
                  <td
                    style={{
                      padding: "0.375rem 0",
                      color: "var(--color-text-subtle, #9ca3af)",
                    }}
                  >
                    {typeof entry.timestamp === "string"
                      ? new Date(entry.timestamp).toLocaleDateString()
                      : entry.timestamp.toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
