"use client";

import { useEffect, useState } from "react";
import { useCommandPalette } from "./CommandPaletteProvider";

/** Header affordance that surfaces the ⌘K shortcut and opens the command palette. */
export function CommandPaletteTrigger() {
  const { setOpen } = useCommandPalette();
  const [hint, setHint] = useState("Ctrl K");

  useEffect(() => {
    const isMac = /Mac|iPhone|iPad/.test(window.navigator.platform ?? "");
    setHint(isMac ? "⌘K" : "Ctrl K");
  }, []);

  return (
    <button
      type="button"
      className="command-palette-trigger"
      onClick={() => setOpen(true)}
      aria-label="Open command palette"
      title="Open command palette"
    >
      <span aria-hidden="true">🔍</span>
      <kbd className="command-palette-trigger-hint">{hint}</kbd>
    </button>
  );
}
