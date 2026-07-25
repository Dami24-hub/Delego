"use client";

import { useState } from "react";
import { MobileNav } from "./MobileNav";

/**
 * Top application bar.
 * On mobile it exposes a hamburger button that toggles the MobileNav drawer;
 * on desktop the hamburger is hidden (navigation lives in the Sidebar).
 */
export function Header() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <header className="app-header">
      <button
        type="button"
        className="hamburger"
        onClick={() => setMobileNavOpen(true)}
        aria-label="Open navigation menu"
        aria-expanded={mobileNavOpen}
      >
        ☰
      </button>

      <p className="app-header-brand">Delego</p>

      <div className="app-header-spacer" />

      {/* TODO: wallet status / user avatar menu */}

      <MobileNav
        open={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
      />
    </header>
  );
}
