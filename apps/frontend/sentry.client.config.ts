import * as Sentry from "@sentry/nextjs";

/**
 * Browser-side Sentry init (#511). Scrubs auth tokens and localStorage
 * contents from every event before it leaves the client — see `beforeSend`.
 */
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || process.env.NODE_ENV,
  release: process.env.NEXT_PUBLIC_SENTRY_RELEASE,
  tracesSampleRate: Number(process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ?? "0.1"),
  enabled: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),
  beforeSend(event) {
    return scrubEvent(event);
  },
});

/** Strip auth tokens, cookies, and any localStorage snapshot from an event. */
export function scrubEvent<T extends { request?: unknown; extra?: Record<string, unknown> }>(
  event: T
): T {
  if (event.request && typeof event.request === "object") {
    const request = event.request as Record<string, unknown>;
    delete request.cookies;
    if (request.headers && typeof request.headers === "object") {
      const headers = request.headers as Record<string, unknown>;
      delete headers.authorization;
      delete headers.Authorization;
      delete headers.cookie;
      delete headers.Cookie;
    }
  }
  if (event.extra) {
    delete event.extra.localStorage;
    delete event.extra.sessionStorage;
  }
  return event;
}
