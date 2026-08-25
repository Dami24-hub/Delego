"use client";

import { useEffect } from "react";
import { Button } from "@delegolabs/ui";
import type { Order } from "@delegolabs/types";
import { formatXlm } from "../../lib/orders";
import { ApprovalAgeBadge } from "./ApprovalAgeBadge";

export interface ApprovalDrawerProps {
  order: Order | null;
  pending?: boolean;
  onApprove: (id: string) => void | Promise<unknown>;
  onReject: (id: string, reason?: string) => void | Promise<unknown>;
  onClose: () => void;
}

/**
 * Slide-over detail panel for a single approval — opened via the "Enter" hotkey
 * (FE-023) or by clicking a background approval notification.
 */
export function ApprovalDrawer({
  order,
  pending = false,
  onApprove,
  onReject,
  onClose,
}: ApprovalDrawerProps) {
  useEffect(() => {
    if (!order) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [order, onClose]);

  if (!order) return null;

  return (
    <div className="approval-drawer-overlay" onClick={onClose}>
      <div
        className="approval-drawer"
        role="dialog"
        aria-modal="true"
        aria-label={`Order ${order.id} details`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="approval-drawer-header">
          <h2>Order {order.id}</h2>
          <ApprovalAgeBadge createdAt={order.createdAt} />
          <button
            type="button"
            aria-label="Close"
            className="approval-drawer-close"
            onClick={onClose}
          >
            ×
          </button>
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
        </dl>

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
                <td>{formatXlm(item.unitPriceStroops)} XLM</td>
                <td>{formatXlm(item.unitPriceStroops * BigInt(item.quantity))} XLM</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="approval-total">
          <span>Total</span>
          <strong>{formatXlm(order.totalStroops)} XLM</strong>
        </div>

        <div className="form-actions">
          <Button variant="primary" onClick={() => onApprove(order.id)} disabled={pending}>
            Approve
          </Button>
          <Button variant="ghost" onClick={() => onReject(order.id)} disabled={pending}>
            Reject
          </Button>
        </div>
      </div>
    </div>
  );
}
