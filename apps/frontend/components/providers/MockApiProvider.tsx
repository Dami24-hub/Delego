"use client";

import { useEffect, useState, type ReactNode } from "react";

/**
 * Starts the MSW browser worker in local dev when `NEXT_PUBLIC_MOCK_API=true`
 * (FE-045), so the app can run against realistic fixtures without a running
 * backend gateway. No-ops in production builds and in tests (Playwright/
 * vitest use their own MSW setup — see mocks/server.ts and e2e/fixtures).
 */
export function MockApiProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(process.env.NEXT_PUBLIC_MOCK_API !== "true");

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_MOCK_API !== "true") return;

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
