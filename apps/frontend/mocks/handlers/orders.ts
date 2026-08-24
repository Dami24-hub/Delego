import { http, HttpResponse } from "msw";
import { buildOrderList, errorResponse, okResponse } from "../fixtures/orders";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://api.example.com";

let orders = buildOrderList(5);

/** Reset in-memory fixture state between tests. */
export function resetOrders(seedCount = 5) {
  orders = buildOrderList(seedCount);
}

export const orderHandlers = [
  http.get(`${BASE_URL}/orders`, () => {
    return HttpResponse.json(okResponse(orders));
  }),

  http.post(`${BASE_URL}/orders/:id/approve`, ({ params }) => {
    const id = params.id as string;
    const existing = orders.find((o) => o.id === id);
    if (!existing) {
      return HttpResponse.json(errorResponse("Order not found", "not_found"), { status: 404 });
    }
    const updated = { ...existing, status: "approved" as const, updatedAt: new Date() };
    orders = orders.map((o) => (o.id === id ? updated : o));
    return HttpResponse.json(okResponse(updated));
  }),

  http.post(`${BASE_URL}/orders/:id/reject`, ({ params }) => {
    const id = params.id as string;
    const existing = orders.find((o) => o.id === id);
    if (!existing) {
      return HttpResponse.json(errorResponse("Order not found", "not_found"), { status: 404 });
    }
    const updated = { ...existing, status: "cancelled" as const, updatedAt: new Date() };
    orders = orders.map((o) => (o.id === id ? updated : o));
    return HttpResponse.json(okResponse(updated));
  }),
];

/** Scenario variant: no orders yet (FE-035 empty state). */
export const orderHandlersEmpty = [
  http.get(`${BASE_URL}/orders`, () => HttpResponse.json(okResponse([]))),
];

/** Scenario variant: gateway error. */
export const orderHandlersError = [
  http.get(`${BASE_URL}/orders`, () =>
    HttpResponse.json(errorResponse("Failed to load orders"), { status: 500 })
  ),
];

/** Scenario variant: paginated-looking large list. */
export const orderHandlersPaginated = [
  http.get(`${BASE_URL}/orders`, () => HttpResponse.json(okResponse(buildOrderList(50)))),
];
