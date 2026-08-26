# Whole-account export format

Settings → Privacy → "Request full export" downloads a single JSON file
containing everything the app knows about the signed-in account. This is the
sovereignty principle from [../vision.md](../vision.md) ("users control their
personal and transaction data") applied at the account level — regulators and
users alike get one file, not a hunt across pages.

It's distinct from the table-scoped orders CSV export in the command palette
(`hooks/useBuiltinCommands.ts`, `lib/csv.ts`), which exports only the current
order list as CSV. This export covers the whole account, as JSON, from
`lib/export.ts`.

## Envelope shape

```jsonc
{
  "generatedAt": "2026-08-24T22:00:00.000Z", // ISO 8601, export build time
  "appVersion": "0.0.1",                     // apps/frontend/package.json version
  "account": {
    "profile": {
      "id": "user-1",
      "stellarAddress": "GABC...",
      "displayName": "Ada",
      "email": "ada@example.com",
      "createdAt": "2026-01-01T00:00:00.000Z",
      "updatedAt": "2026-01-02T00:00:00.000Z"
    },
    "preferences": {
      "defaultSpendingLimitStroops": "5000000000",
      "requireApproval": true,
      "notificationEmail": true,
      "notificationPush": false
    }
  },
  "delegations": [
    {
      "id": "del-1",
      "agentId": "agent-1",
      "status": "active",
      "policy": {
        "maxPerTransactionStroops": "10000000000",
        "maxTotalStroops": "100000000000",
        "allowedMerchants": ["merchant-1"],
        "expiresAt": null
      },
      "createdAt": "2026-01-01T00:00:00.000Z",
      "updatedAt": "2026-01-01T00:00:00.000Z"
    }
  ],
  "orders": [
    {
      "id": "order-1",
      "merchantId": "merchant-1",
      "delegationId": "del-1",
      "status": "settled",
      "totalStroops": "10000000000",
      "createdAt": "2026-01-03T00:00:00.000Z",
      "updatedAt": "2026-01-04T00:00:00.000Z"
    }
  ],
  "approvalDecisions": [
    {
      "orderId": "order-1",
      "decision": "approved",
      "amountStroops": "10000000000",
      "merchantId": "merchant-1",
      "decidedAt": "2026-01-04T00:00:00.000Z"
    }
  ]
}
```

All amounts are stroops (1 XLM = 10,000,000 stroops) encoded as **decimal
strings**, not JSON numbers — `bigint` isn't representable in JSON and
amounts can exceed `Number.MAX_SAFE_INTEGER`. Divide by `10_000_000` (as a
`BigInt`, then format) to get XLM; see `formatXlm` in `lib/orders.ts` for the
display-side helper this mirrors.

All timestamps are ISO 8601 strings (UTC).

### `approvalDecisions` is derived, not fetched

There's no dedicated "approval decision" record in the API today — an order
carries its own lifecycle status (see `ORDER_LIFECYCLE` /
`TERMINAL_STATUSES` in `lib/orders.ts`). `approvalDecisions` is built by
walking `orders` and, for any order that has moved past `pending_approval`,
recording:

- `"approved"` if the order is on the happy-path lifecycle
  (`approved` → `escrowed` → `fulfilled` → `settled`)
- `"rejected"` otherwise (e.g. `cancelled`, `disputed`)

`draft` and `pending_approval` orders have no decision yet and are omitted
from this section (they're still present in `orders`). If the backend ever
grows a first-class approval-decision record (reviewer identity, a written
reason, etc.), this section should switch to fetching it directly instead of
re-deriving it from order status.

## Assembly: chunked, cancellable, no full-history buffer

`@delegolabs/sdk`'s `getOrders()` / `getDelegations()` return the full list
in one response — there's no server-side pagination to page through client-side
today. "Chunked" here applies to serialization, not the network call:
`lib/export.ts` walks each list in batches of 200, JSON-encoding one batch at
a time and yielding to the event loop between batches (via `serializeArrayChunked`).
The resulting string parts are handed to `Blob` as an array rather than
concatenated into one JSON string first, so no single buffer holds the whole
export.

This is what makes cancel and progress work for large histories:

- `useAccountExport` passes an `AbortSignal`; every batch boundary checks it,
  so cancelling mid-export stops within one batch (≤200 records), not just
  between network calls.
- `onProgress` fires once per batch with `{ phase, completed, total }`,
  driving the progress bar in `PrivacyExportCard`.

## Versioning

If the envelope shape changes in a way that isn't purely additive (a field
renamed or removed, a type changed), bump a `schemaVersion` field into the
envelope and document the change here. No consumer of this file exists yet
outside the browser download, so nothing has needed that yet.
