"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";

type Politeness = "polite" | "assertive";

interface AnnounceContextValue {
  /** Announce a message to screen reader users via a shared aria-live region. */
  announce: (message: string, politeness?: Politeness) => void;
}

const AnnounceContext = createContext<AnnounceContextValue | null>(null);

/**
 * Provides a single shared aria-live region for async outcome announcements
 * (approval submitted, order rejected, notification arrivals, etc.) per the
 * FE-050 a11y sweep. Two regions are rendered — "polite" and "assertive" — so
 * callers can choose whether the announcement should interrupt.
 *
 * Messages are cleared and re-set on a microtask delay so that announcing the
 * same message twice in a row is still read out by screen readers.
 */
export function AnnounceProvider({ children }: { children: ReactNode }) {
  const [politeMessage, setPoliteMessage] = useState("");
  const [assertiveMessage, setAssertiveMessage] = useState("");
  const politeTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  );
  const assertiveTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  );

  const announce = useCallback(
    (message: string, politeness: Politeness = "polite") => {
      const setMessage =
        politeness === "assertive" ? setAssertiveMessage : setPoliteMessage;
      const timeoutRef =
        politeness === "assertive" ? assertiveTimeoutRef : politeTimeoutRef;
      setMessage("");
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setMessage(message), 50);
    },
    []
  );

  return (
    <AnnounceContext.Provider value={{ announce }}>
      {children}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {politeMessage}
      </div>
      <div aria-live="assertive" aria-atomic="true" className="sr-only">
        {assertiveMessage}
      </div>
    </AnnounceContext.Provider>
  );
}

/** Access the shared aria-live announcer. Must be used within an AnnounceProvider. */
export function useAnnounce(): AnnounceContextValue {
  const ctx = useContext(AnnounceContext);
  if (!ctx) {
    return { announce: () => {} };
  }
  return ctx;
}
