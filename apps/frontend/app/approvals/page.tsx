"use client";

import { useCallback, useMemo } from "react";
import { Amount, Card } from "@delegolabs/ui";
import { useOrders } from "../../hooks/useOrders";
import { useAnnounce } from "../../hooks/useAnnounce";
import { useCurrency } from "../../hooks/useCurrency";
import { HIGH_VALUE_THRESHOLD_STROOPS, needsApproval, sumOrderTotals } from "../../lib/orders";
import { ApprovalCard } from "../../components/orders/ApprovalCard";

/** Approval workflow — review and approve/reject high-value orders. */
export default function ApprovalsPage() {
  const { orders, loading, error, pendingIds, approveOrder, rejectOrder } =
    useOrders();
  const { announce } = useAnnounce();
  const { currencyId, rate } = useCurrency();

  const handleApprove = useCallback(
    async (id: string) => {
      const result = await approveOrder(id);
      announce(
        result ? `Order ${id} approved.` : `Failed to approve order ${id}.`
      );
    },
    [approveOrder, announce]
  );

  const handleReject = useCallback(
    async (id: string, reason?: string) => {
      const result = await rejectOrder(id, reason);
      announce(
        result ? `Order ${id} rejected.` : `Failed to reject order ${id}.`
      );
    },
    [rejectOrder, announce]
  );

  const queue = useMemo(
    () => orders.filter((order) => needsApproval(order)),
    [orders]
  );
  const pendingValue = useMemo(() => sumOrderTotals(queue), [queue]);

  return (
    <div className="settings-page">
      <header className="header">
        <h1>Approvals</h1>
        <p>
          Review high-value orders (over{" "}
          <Amount stroops={HIGH_VALUE_THRESHOLD_STROOPS} currency={currencyId} xlmUsdRate={rate?.xlmUsdRate} />)
          that require your sign-off before they proceed
        </p>
      </header>

      {error && (
        <div className="settings-status error" role="alert">
          {error}
        </div>
      )}

      <div className="grid">
        <Card title="Awaiting review">
          <p className="stat-value stat-neutral">{queue.length}</p>
          <p className="stat-label">High-value orders</p>
        </Card>
        <Card title="Value pending approval">
          <p className="stat-value">
            <Amount stroops={pendingValue} currency={currencyId} xlmUsdRate={rate?.xlmUsdRate} />
          </p>
          <p className="stat-label">Across the queue</p>
        </Card>
      </div>

      {loading && orders.length === 0 ? (
        <div className="card skeleton">
          <div className="skeleton-title" />
          <div className="skeleton-text" />
          <div className="skeleton-text" />
          <div className="skeleton-button" />
        </div>
      ) : queue.length === 0 ? (
        <div className="card">
          <p>All caught up — no high-value orders are awaiting approval.</p>
        </div>
      ) : (
        <div className="grid">
          {queue.map((order) => (
            <ApprovalCard
              key={order.id}
              order={order}
              pending={pendingIds.has(order.id)}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          ))}
        </div>
      )}
    </div>
  );
}
