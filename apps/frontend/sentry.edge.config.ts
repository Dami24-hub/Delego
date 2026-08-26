import * as Sentry from "@sentry/nextjs";
import { scrubEvent } from "./sentry.client.config";

/** Edge runtime Sentry init (#511) — middleware and edge route handlers. */
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || process.env.NODE_ENV,
  release: process.env.NEXT_PUBLIC_SENTRY_RELEASE,
  tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? "0.1"),
  enabled: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),
  beforeSend(event) {
    return scrubEvent(event);
  },
});
