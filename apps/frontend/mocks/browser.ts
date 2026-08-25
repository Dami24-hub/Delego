import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";

/**
 * Browser MSW worker for local dev mode (FE-045).
 *
 * Only started when `NEXT_PUBLIC_MOCK_API=true` (see components/providers/
 * MockApiProvider.tsx) — lets the app run against realistic fixtures without
 * a running backend gateway.
 */
export const worker = setupWorker(...handlers);
