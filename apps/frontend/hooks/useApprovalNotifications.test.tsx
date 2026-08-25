import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import type { Order } from "@delegolabs/types";
import { NotificationProvider, useNotifications } from "./useNotifications";
import { AnnounceProvider } from "./useAnnounce";
import { useApprovalNotifications } from "./useApprovalNotifications";

const notifyMock = vi.fn().mockReturnValue(false);
vi.mock("./useOsNotifications", () => ({
  useOsNotifications: () => ({
    supported: true,
    permission: "granted",
    enabled: true,
    setEnabled: vi.fn(),
    requestPermission: vi.fn(),
    notify: notifyMock,
  }),
}));

function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: "order-1",
    userId: "user-1",
    delegationId: "del-1",
    merchantId: "merchant-1",
    status: "pending_approval",
    lineItems: [],
    totalStroops: 2_000n * 10_000_000n,
    escrowContractId: null,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z"),
    ...overrides,
  };
}

function renderBridge(initialQueue: Order[], initialLoading = false) {
  return renderHook(
    ({ queue, loading }: { queue: Order[]; loading: boolean }) => {
      useApprovalNotifications({ queue, loading });
      return useNotifications();
    },
    {
      initialProps: { queue: initialQueue, loading: initialLoading },
      wrapper: ({ children }) => (
        <AnnounceProvider>
          <NotificationProvider>{children}</NotificationProvider>
        </AnnounceProvider>
      ),
    }
  );
}

describe("useApprovalNotifications", () => {
  beforeEach(() => {
    localStorage.clear();
    notifyMock.mockClear();
  });

  it("does not notify for orders already pending on first load (seeds silently)", () => {
    const { result } = renderBridge([makeOrder({ id: "a" }), makeOrder({ id: "b" })]);
    expect(result.current.notifications).toHaveLength(0);
    expect(notifyMock).not.toHaveBeenCalled();
  });

  it("notifies exactly once (in-app) for a genuinely new arrival after the first load", () => {
    const { result, rerender } = renderBridge([makeOrder({ id: "a" })]);
    rerender({ queue: [makeOrder({ id: "a" }), makeOrder({ id: "b" })], loading: false });

    expect(result.current.notifications).toHaveLength(1);
    expect(result.current.notifications[0].id).toBe("approval-b");
    expect(notifyMock).toHaveBeenCalledTimes(1);
  });

  it("does not re-notify for an order already seen across further re-renders", () => {
    const { result, rerender } = renderBridge([makeOrder({ id: "a" })]);
    rerender({ queue: [makeOrder({ id: "a" }), makeOrder({ id: "b" })], loading: false });
    rerender({ queue: [makeOrder({ id: "a" }), makeOrder({ id: "b" })], loading: false });

    expect(result.current.notifications).toHaveLength(1);
    expect(notifyMock).toHaveBeenCalledTimes(1);
  });

  it("waits until loading is false before seeding", () => {
    const { result, rerender } = renderBridge([makeOrder({ id: "a" })], true);
    // Still loading: the effect must not have seeded yet.
    rerender({ queue: [makeOrder({ id: "a" })], loading: false });
    // First non-loading pass seeds "a" silently.
    rerender({ queue: [makeOrder({ id: "a" }), makeOrder({ id: "b" })], loading: false });

    expect(result.current.notifications).toHaveLength(1);
    expect(result.current.notifications[0].id).toBe("approval-b");
  });
});
