"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { CommandRegistryProvider } from "../../hooks/useCommandRegistry";
import { useBuiltinCommands } from "../../hooks/useBuiltinCommands";

// Not part of the initial bundle: only fetched the first time the palette opens.
const CommandPalette = dynamic(
  () => import("./CommandPalette").then((mod) => mod.CommandPalette),
  { ssr: false, loading: () => null }
);

interface CommandPaletteContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const CommandPaletteContext = createContext<CommandPaletteContextValue | null>(
  null
);

/** Open/close the command palette from anywhere (e.g. a header trigger button). */
export function useCommandPalette(): CommandPaletteContextValue {
  const ctx = useContext(CommandPaletteContext);
  if (!ctx) {
    throw new Error(
      "useCommandPalette must be used within a CommandPaletteProvider"
    );
  }
  return ctx;
}

function BuiltinCommands() {
  useBuiltinCommands();
  return null;
}

/**
 * Owns the command palette's open state and the global ⌘K / Ctrl+K binding.
 * The registry (and built-in commands) is always mounted so features can
 * register commands immediately; only the palette's own UI is lazy-loaded.
 */
export function CommandPaletteProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close on route change, including navigation the palette didn't initiate.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const isModifierK =
        (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k";
      if (!isModifierK) return;
      event.preventDefault();
      setOpen((v) => !v);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <CommandRegistryProvider>
      <CommandPaletteContext.Provider value={{ open, setOpen }}>
        <BuiltinCommands />
        {children}
        {open && <CommandPalette onClose={() => setOpen(false)} />}
      </CommandPaletteContext.Provider>
    </CommandRegistryProvider>
  );
}
