# MSW mock API layer (FE-045)

`apps/frontend/mocks/` is the single source of mock responses shared by vitest, dev mode (`NEXT_PUBLIC_MOCK_API=true`), and Playwright E2E route interception. It intercepts `fetch` calls made by `DelegoClient` (`@delegolabs/sdk`) at the network boundary, so hooks/components exercise the exact same request/response cycle as production.

## Layout

```
mocks/
  fixtures/       typed fixture factories (one file per resource)
  handlers/       MSW `http` handlers (one file per resource) + scenario variants
  server.ts       msw/node server for vitest (tests/setup.ts starts/stops it)
  browser.ts      msw/browser worker for dev mode (components/providers/MockApiProvider.tsx)
```

## Adding a new endpoint

1. **Fixture factory** — add `buildX(seed, overrides?)` to `mocks/fixtures/<resource>.ts`, following the existing `buildDelegation`/`buildOrder`/`buildEscrow` pattern: deterministic (seeded via `createSeededRandom`), returns a valid `@delegolabs/types` shape, accepts `Partial<T>` overrides.
2. **Handler** — add an `http.get/post/patch/delete(...)` to `mocks/handlers/<resource>.ts`, matching the real gateway path (`${BASE_URL}/<resource>`). Export it in the resource's default array (e.g. `delegationHandlers`).
3. **Scenario variants** — export `*HandlersEmpty`, `*HandlersError`, `*HandlersPaginated` (or a new variant) alongside the default handlers, for empty-state and error-path tests.
4. **Register** — re-export new handlers/variants from `mocks/handlers/index.ts`.
5. **Type safety** — fixtures must satisfy the real `@delegolabs/types` shape; if the type changes upstream, `pnpm typecheck` will fail on the fixture file (no `any` escapes).

## Using scenario variants in a test

```ts
import { server } from "../../mocks/server";
import { delegationHandlersEmpty } from "../../mocks/handlers";

it("shows the empty state", async () => {
  server.use(...delegationHandlersEmpty);
  // ... render and assert
});
```

`server.resetHandlers()` runs automatically after every test (see `tests/setup.ts`), so overrides never leak between tests.

## Dev mode

Set `NEXT_PUBLIC_MOCK_API=true` in `.env.local` to run the app against these fixtures without a backend gateway. `components/providers/MockApiProvider.tsx` starts the MSW browser worker before rendering the app shell.

## Known gap

`@delegolabs/sdk` is a private package (GitHub Packages) not available in this environment, so exact REST paths/verbs for mutation endpoints (`PATCH /delegations/:id`, `POST /orders/:id/approve`, etc.) are inferred from `apps/frontend/hooks/*.ts` call sites and `lib/api.test.ts`'s confirmed `GET {baseUrl}/health` convention, not verified against the SDK source. If a handler path doesn't match production, update it here — this doc and the handler are the two places to fix.
