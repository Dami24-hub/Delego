"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

/**
 * Root-layout error boundary — catches errors the layout itself throws.
 * Must render its own <html>/<body> since it replaces the whole tree (#511).
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
          <p style={{ margin: "0 0 1rem", fontWeight: 500 }}>Something went wrong</p>
          <p style={{ margin: "0 0 1.5rem", fontSize: "0.875rem", color: "#6b7280" }}>
            The error has been reported. Please refresh the page.
          </p>
          <button type="button" onClick={reset}>
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
