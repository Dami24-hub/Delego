"use client";

import { useEffect, useState, type ReactNode } from "react";
import { isDemoMode } from "../../lib/demoMode";

/**
 * Starts the MSW browser worker when `NEXT_PUBLIC_MOCK_API=true` (FE-045)
 * or when demo mode is active (#632), so the app can run against realistic
 * fixtures without a running backend gateway. No-ops in production builds
 * outside demo mode and in tests (Playwright/vitest use their own MSW
 * setup — see mocks/server.ts and e2e/fixtures).
 *
 * `isDemoMode()` reads sessionStorage, which doesn't exist on the server —
 * so the initial `ready` state below deliberately mirrors the server-only
 * `NEXT_PUBLIC_MOCK_API` check (a build-time constant, safe to read during
 * SSR) to avoid a hydration mismatch, and the demo-mode check only runs
 * inside the effect, after hydration has already completed.
 */
export function MockApiProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(
    process.env.NEXT_PUBLIC_MOCK_API !== "true"
  );

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_MOCK_API !== "true" && !isDemoMode()) {
      setReady(true);
      return;
    }

    let cancelled = false;
    import("../../mocks/browser").then(({ worker }) => {
      if (cancelled) return;
      worker.start({ onUnhandledRequest: "bypass" }).then(() => {
        if (!cancelled) setReady(true);
      });
    });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) return null;
  return <>{children}</>;
}
