import { http, HttpResponse } from "msw";
import { buildEscrowList, errorResponse, okResponse } from "../fixtures/escrows";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://api.example.com";

export const escrowHandlers = [
  http.get(`${BASE_URL}/escrows`, () => {
    return HttpResponse.json(okResponse(buildEscrowList(5)));
  }),
];

/** Scenario variant: no escrows yet (FE-035 empty state). */
export const escrowHandlersEmpty = [
  http.get(`${BASE_URL}/escrows`, () => HttpResponse.json(okResponse([]))),
];

/** Scenario variant: gateway error. */
export const escrowHandlersError = [
  http.get(`${BASE_URL}/escrows`, () =>
    HttpResponse.json(errorResponse("Failed to load escrows"), { status: 500 })
  ),
];

/** Scenario variant: paginated-looking large list. */
export const escrowHandlersPaginated = [
  http.get(`${BASE_URL}/escrows`, () => HttpResponse.json(okResponse(buildEscrowList(50)))),
];
