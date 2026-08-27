"use client";

import { useEffect, useState } from "react";
import { isDemoMode, disableDemoMode } from "../../lib/demoMode";

/**
 * Persistent, unmissable banner shown for the lifetime of demo mode (#632).
 * Unlike AnnouncementBanner, this never dismisses itself — only exiting
 * demo mode removes it, so a visitor always knows they're looking at
 * fixtures, not their real account.
 *
 * Rendered client-only: `isDemoMode()` reads sessionStorage, which doesn't
 * exist during SSR, so this starts hidden and reveals itself in an effect
 * to avoid a hydration mismatch (see MockApiProvider for the same pattern).
 */
export function DemoBanner() {
  const [active, setActive] = useState(false);

  useEffect(() => {
    setActive(isDemoMode());
  }, []);

  if (!active) return null;

  function handleExit() {
    disableDemoMode();
    window.location.href = "/";
  }

  return (
    <div className="demo-banner" role="status">
      <span className="demo-banner-icon" aria-hidden="true">
        🧪
      </span>
      <span>
        <strong>Demo — no real funds.</strong> You&apos;re viewing sample data;
        actions that would change anything are disabled.
      </span>
      <button type="button" className="demo-banner-exit" onClick={handleExit}>
        Exit demo
      </button>
    </div>
  );
}
