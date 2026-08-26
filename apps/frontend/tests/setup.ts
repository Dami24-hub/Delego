import "@testing-library/jest-dom";
import { afterAll, afterEach, beforeAll } from "vitest";
import { server } from "../mocks/server";

/**
 * Global MSW server lifecycle for every vitest run (FE-045). Individual test
 * files layer scenario handlers on top with `server.use(...)` and MSW resets
 * to these defaults in `afterEach` via `resetHandlers`.
 */
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
