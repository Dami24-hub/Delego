"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { Amount, Button, Card } from "@delegolabs/ui";
import type { Order } from "@delegolabs/types";
import { formatDateTime } from "../../lib/intl";
import { useCurrency } from "../../hooks/useCurrency";
import { useAnnounce } from "../../hooks/useAnnounce";
import { useNetworkMismatch } from "../../hooks/useNetworkMismatch";
import { ApprovalAgeBadge } from "./ApprovalAgeBadge";

export interface ApprovalCardProps {
  order: Order;
  /** True while an approve/reject request for this order is in flight. */
  pending?: boolean;
  /** True when a mutation for this order is queued offline awaiting reconnect replay (#618). */
  pendingOffline?: boolean;
  onApprove: (id: string) => void | Promise<unknown>;
  onReject: (id: string, reason?: string) => void | Promise<unknown>;
}

/**
 * Review card for a single high-value order awaiting approval. Shows the line
 * items and total, and gates rejection behind an inline reason prompt.
 */
export function ApprovalCard({
  order,
  pending = false,
  pendingOffline = false,
  onApprove,
  onReject,
}: ApprovalCardProps) {
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");

  const { isMismatched } = useNetworkMismatch();
  const locale = useLocale();
  const { currencyId, rate } = useCurrency();
  const { announce } = useAnnounce();

  const disabled = pending || isMismatched;

  const mismatchTitle = isMismatched
    ? "Cannot execute action while wallet and app network are mismatched"
    : undefined;

  const handleApprove = async () => {
    try {
      await onApprove(order.id);
      announce(`Order ${order.id} approved.`, "polite");
    } catch {
      announce(`Failed to approve order ${order.id}.`, "assertive");
    }
  };

  const handleReject = async () => {
    try {
      await onReject(order.id, reason.trim() || undefined);
      announce(`Order ${order.id} rejected.`, "polite");
    } catch {
      announce(`Failed to reject order ${order.id}.`, "assertive");
    }
  };

  return (
    <Card
      title={`Order ${order.id}`}
      ariaLabel={`High-value order ${order.id} awaiting approval`}
      style={{
        opacity: pending || pendingOffline ? 0.7 : 1,
        transition: "opacity 0.15s ease-in-out",
      }}
    >
      <div className="approval-card-header">
        <span className="status-badge order-status-pending_approval">
          Pending approval
        </span>

        {pendingOffline && (
          <span
            className="status-badge"
            style={{
              background: "var(--color-warning-bg)",
              color: "var(--color-warning-text)",
              border: "1px solid var(--color-warning-border)",
            }}
            title="Queued offline — will sync automatically upon reconnect"
          >
            ⚡ Pending offline
          </span>
        )}

        <ApprovalAgeBadge createdAt={order.createdAt} />

        <span
          className="approval-flag"
          title="Exceeds the high-value threshold"
        >
          ⚠ High value
        </span>
      </div>

      <dl className="wallet-detail-list">
        <div className="wallet-detail-row">
          <dt>Merchant</dt>
          <dd>{order.merchantId}</dd>
        </div>

        <div className="wallet-detail-row">
          <dt>Delegation</dt>
          <dd>{order.delegationId}</dd>
        </div>

        <div className="wallet-detail-row">
          <dt>Requested</dt>
          <dd>{formatDateTime(order.createdAt, locale)}</dd>
        </div>
      </dl>

      <div className="approval-line-items">
        <table className="comparison-table">
          <thead>
            <tr>
              <th scope="col">Product</th>
              <th scope="col">Qty</th>
              <th scope="col">Unit</th>
              <th scope="col">Subtotal</th>
            </tr>
          </thead>

          <tbody>
            {order.lineItems.map((item) => (
              <tr key={item.productId}>
                <td>{item.productId}</td>
                <td>{item.quantity}</td>

                <td>
                  <Amount
                    stroops={item.unitPriceStroops}
                    locale={locale}
                    currency={currencyId}
                    xlmUsdRate={rate?.xlmUsdRate}
                  />
                </td>

                <td>
                  <Amount
                    stroops={
                      item.unitPriceStroops * BigInt(item.quantity)
                    }
                    locale={locale}
                    currency={currencyId}
                    xlmUsdRate={rate?.xlmUsdRate}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="approval-total">
        <span>Total</span>

        <strong>
          <Amount
            stroops={order.totalStroops}
            locale={locale}
            currency={currencyId}
            xlmUsdRate={rate?.xlmUsdRate}
          />
        </strong>
      </div>

      {!rejecting ? (
        <div className="form-actions">
          <Button
            variant="primary"
            onClick={handleApprove}
            disabled={disabled}
            title={mismatchTitle}
          >
            Approve
          </Button>

          <Button
            variant="ghost"
            onClick={() => setRejecting(true)}
            disabled={disabled}
            title={mismatchTitle}
          >
            Reject
          </Button>
        </div>
      ) : (
        <div className="approval-reject">
          <label
            htmlFor={`reject-reason-${order.id}`}
            className="approval-reject-label"
          >
            Reason (optional)
          </label>

          <textarea
            id={`reject-reason-${order.id}`}
            className="approval-reject-input"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            placeholder="Why is this order being rejected?"
            disabled={isMismatched}
          />

          <div className="form-actions">
            <Button
              variant="primary"
              onClick={handleReject}
              disabled={disabled}
              title={mismatchTitle}
            >
              Confirm rejection
            </Button>

            <Button
              variant="ghost"
              onClick={() => {
                setRejecting(false);
                setReason("");
              }}
              disabled={disabled}
              title={mismatchTitle}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}