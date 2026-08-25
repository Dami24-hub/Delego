"use client";

import { ActivityTimeline, Card } from "@delegolabs/ui";
import type { Order } from "@delegolabs/types";
import { formatXlm, isTerminal, orderToTimelineEvents } from "../../lib/orders";

export interface OrderTrackingCardProps {
  order: Order;
}

function formatTime(date: Date): string {
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

/** Live-tracking card: lifecycle timeline plus the latest known order details. */
export function OrderTrackingCard({ order }: OrderTrackingCardProps) {
  const settled = isTerminal(order);

  return (
    <Card
      title={`Order ${order.id}`}
      ariaLabel={`Tracking for order ${order.id}`}
    >
      <ActivityTimeline
        events={orderToTimelineEvents(order)}
        ariaLabel="Order progress"
      />

      <dl className="wallet-detail-list">
        <div className="wallet-detail-row">
          <dt>Merchant</dt>
          <dd>{order.merchantId}</dd>
        </div>
        <div className="wallet-detail-row">
          <dt>Total</dt>
          <dd>{formatXlm(order.totalStroops)} XLM</dd>
        </div>
        <div className="wallet-detail-row">
          <dt>Escrow</dt>
          <dd>{order.escrowContractId ?? "Not yet escrowed"}</dd>
        </div>
        <div className="wallet-detail-row">
          <dt>{settled ? "Completed" : "Last update"}</dt>
          <dd>{formatTime(order.updatedAt)}</dd>
        </div>
      </dl>
    </Card>
  );
}
