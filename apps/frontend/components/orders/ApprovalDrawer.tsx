"use client";

import { useEffect, useRef } from "react";
import { Button } from "@delegolabs/ui";
import type { Order } from "@delegolabs/types";
import { formatXlm } from "../../lib/orders";
import type { OrderExplainability } from "../../lib/approvalExplainability";
import { ApprovalAgeBadge } from "./ApprovalAgeBadge";
import { useFocusTrap } from "../../hooks/useFocusTrap";

export interface ApprovalDrawerProps {
  order: Order | null;
  pending?: boolean;
  /**
   * Agent explainability data for `order` (item imagery, price hints, reasoning,
   * evidence links, delegation context). Optional — sections with no data
   * collapse cleanly. Keyed by the caller to the currently-open order.
   */
  explainability?: OrderExplainability;
  onApprove: (id: string) => void | Promise<unknown>;
  onReject: (id: string, reason?: string) => void | Promise<unknown>;
  onClose: () => void;
}

/**
 * Slide-over detail panel for a single approval — opened via the "Enter" hotkey
 * (FE-023) or by clicking a background approval notification. Includes the
 * agent explainability panel (#530): reasoning, price-range hints, evidence
 * links, and delegation context, alongside the standard line-item breakdown.
 */
export function ApprovalDrawer({
  order,
  pending = false,
  explainability,
  onApprove,
  onReject,
  onClose,
}: ApprovalDrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const isOpen = order !== null;

  useFocusTrap(panelRef, isOpen);

  useEffect(() => {
    if (!order) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [order, onClose]);

  if (!order) return null;

  const priceRangeByProductId = explainability?.priceRangeByProductId;
  const imageUrlByProductId = explainability?.imageUrlByProductId;
  const evidenceLinks = explainability?.evidenceLinks;
  const delegationContext = explainability?.delegationContext;

  return (
    <div className="approval-drawer-overlay" onClick={onClose}>
      <div
        ref={panelRef}
        className="approval-drawer"
        role="dialog"
        aria-modal="true"
        aria-label={`Order ${order.id} details`}
        tabIndex={-1}
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
          {delegationContext && (
            <div className="wallet-detail-row">
              <dt>Remaining limit</dt>
              <dd>{formatXlm(delegationContext.remainingLimitStroops)} XLM</dd>
            </div>
          )}
        </dl>

        {explainability?.reasoning && (
          <section className="approval-explainability-section" aria-label="Agent reasoning">
            <h3>Why the agent chose this</h3>
            <p className="approval-reasoning-text">{explainability.reasoning}</p>
          </section>
        )}

        <div className="approval-line-items">
          <table className="comparison-table">
            <thead>
              <tr>
                <th scope="col">Product</th>
                <th scope="col">Qty</th>
                <th scope="col">Unit</th>
                <th scope="col">Subtotal</th>
                {priceRangeByProductId && <th scope="col">Typical range</th>}
              </tr>
            </thead>
            <tbody>
              {order.lineItems.map((item) => {
                const range = priceRangeByProductId?.[item.productId];
                const imageUrl = imageUrlByProductId?.[item.productId];
                return (
                  <tr key={item.productId}>
                    <td>
                      <div className="approval-line-item-product">
                        {imageUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={imageUrl}
                            alt=""
                            className="approval-line-item-image"
                          />
                        )}
                        <span>{item.productId}</span>
                      </div>
                    </td>
                    <td>{item.quantity}</td>
                    <td>{formatXlm(item.unitPriceStroops)} XLM</td>
                    <td>{formatXlm(item.unitPriceStroops * BigInt(item.quantity))} XLM</td>
                    {priceRangeByProductId && (
                      <td>
                        {range ? (
                          <span
                            className={
                              item.unitPriceStroops > range.highStroops
                                ? "approval-price-hint approval-price-hint-above"
                                : "approval-price-hint"
                            }
                            title={range.label}
                          >
                            {formatXlm(range.lowStroops)}–{formatXlm(range.highStroops)} XLM
                          </span>
                        ) : (
                          <span className="approval-price-hint approval-price-hint-unknown">—</span>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="approval-total">
          <span>Total</span>
          <strong>{formatXlm(order.totalStroops)} XLM</strong>
        </div>

        {evidenceLinks && evidenceLinks.length > 0 && (
          <section className="approval-explainability-section" aria-label="Decision evidence">
            <h3>Decision evidence</h3>
            <ul className="approval-evidence-list">
              {evidenceLinks.map((link) => (
                <li key={link.url}>
                  <a href={link.url} target="_blank" rel="noopener noreferrer">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

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
