"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { Button } from "@delegolabs/ui";

/** Route-segment error boundary — reports the thrown error to Sentry and offers a retry (#511). */
export default function Error({
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
    <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
      <p style={{ margin: "0 0 1rem", fontWeight: 500 }}>Something went wrong</p>
      <p style={{ margin: "0 0 1.5rem", fontSize: "0.875rem", color: "#6b7280" }}>
        The error has been reported. You can try again.
      </p>
      <Button variant="secondary" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
