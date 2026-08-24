"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { Amount, Button, Card } from "@delegolabs/ui";
import type { Order } from "@delegolabs/types";
import { formatDateTime } from "../../lib/intl";
import { useCurrency } from "../../hooks/useCurrency";

export interface ApprovalCardProps {
  order: Order;
  /** True while an approve/reject request for this order is in flight. */
  pending?: boolean;
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
  onApprove,
  onReject,
}: ApprovalCardProps) {
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const locale = useLocale();
  const { currencyId, rate } = useCurrency();

  return (
    <Card
      title={`Order ${order.id}`}
      ariaLabel={`High-value order ${order.id} awaiting approval`}
      style={{ opacity: pending ? 0.6 : 1, transition: "opacity 0.15s ease-in-out" }}
    >
      <div className="approval-card-header">
        <span className="status-badge order-status-pending_approval">
          Pending approval
        </span>
        <span className="approval-flag" title="Exceeds the high-value threshold">
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
                    stroops={item.unitPriceStroops * BigInt(item.quantity)}
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
            onClick={() => onApprove(order.id)}
            disabled={pending}
          >
            Approve
          </Button>
          <Button
            variant="ghost"
            onClick={() => setRejecting(true)}
            disabled={pending}
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
          />
          <div className="form-actions">
            <Button
              variant="primary"
              onClick={() => onReject(order.id, reason.trim() || undefined)}
              disabled={pending}
            >
              Confirm rejection
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setRejecting(false);
                setReason("");
              }}
              disabled={pending}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
