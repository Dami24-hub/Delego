"use client";

import { useCallback } from "react";
import { isDemoMode } from "../lib/demoMode";

export const DEMO_MODE_BLOCKED_MESSAGE =
  "This is a read-only demo — changes aren't saved.";

/**
 * Shared guard for mutating controls in demo mode (#632).
 *
 * Returns `disabledProps` to spread onto a button/control (disables it and
 * sets an explanatory `title` tooltip) and `guard(fn)`, which wraps an
 * event handler so it's a no-op while demo mode is active — a second layer
 * on top of `disabled` in case a control is reachable by keyboard/submit
 * even while visually disabled.
 *
 * The actual backstop is `lib/api.ts`'s `createRetryingFetch`, which
 * rejects every non-GET request outright in demo mode — this hook is the
 * UI layer, not the source of truth for "can this mutate."
 */
export function useDemoModeGuard() {
  const demo = isDemoMode();

  const guard = useCallback(
    <Args extends unknown[]>(fn: (...args: Args) => void) =>
      (...args: Args) => {
        if (isDemoMode()) return;
        fn(...args);
      },
    []
  );

  return {
    isDemoMode: demo,
    disabledProps: demo
      ? { disabled: true, title: DEMO_MODE_BLOCKED_MESSAGE }
      : {},
    guard,
  };
}
