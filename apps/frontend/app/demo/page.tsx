"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { enableDemoMode } from "../../lib/demoMode";

/**
 * Shareable demo-mode entry point (#632). Turns on the session's demo flag
 * and redirects into the app — no wallet, funds, or backend access needed.
 * See lib/demoMode.ts for what "demo mode" changes.
 */
export default function DemoEntryPage() {
  const router = useRouter();

  useEffect(() => {
    enableDemoMode();
    router.replace("/");
  }, [router]);

  return (
    <div className="settings-page">
      <p>Starting the demo…</p>
    </div>
  );
}
