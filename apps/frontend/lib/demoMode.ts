/**
 * Read-only demo/sandbox mode (#632).
 *
 * A per-session flag (not a build-time feature flag — see
 * docs/feature-flags.md for that separate system) that a visitor turns on
 * by visiting `/demo`. While active:
 * - The app runs against MSW fixtures instead of the real gateway (see
 *   MockApiProvider and docs/msw-mocking.md).
 * - `useWallet` reports a synthetic connected wallet instead of talking to
 *   the Freighter extension.
 * - Every mutating request is rejected at the fetch layer (see
 *   `createRetryingFetch`'s demo-mode guard in lib/api.ts) as defense in
 *   depth on top of the UI disabling mutating controls.
 *
 * Session-scoped and client-only by design: `sessionStorage` clears when
 * the tab closes, so a shared `/demo` link never leaves a lingering
 * "demo mode" flag on someone's normal browsing session.
 */
const STORAGE_KEY = "delego:demo-mode";

export const DEMO_WALLET_ADDRESS =
  "GDEMO0000000000000000000000000000000000000000000000000DEMO";
export const DEMO_NETWORK = "TESTNET";
export const DEMO_NETWORK_PASSPHRASE = "Test SDF Network ; September 2015";

function hasSessionStorage(): boolean {
  return typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";
}

/** Synchronous check — safe to call from non-React code (e.g. lib/api.ts). */
export function isDemoMode(): boolean {
  if (!hasSessionStorage()) return false;
  try {
    return window.sessionStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    // Storage access can throw in locked-down environments (private
    // browsing in some browsers, disabled storage). Fail closed — demo
    // mode never silently turns itself on.
    return false;
  }
}

export function enableDemoMode(): void {
  if (!hasSessionStorage()) return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, "true");
  } catch {
    // Nothing to fall back to — /demo's redirect still works, the app
    // just won't be in demo mode. Surfacing this to the visitor isn't
    // worth the complexity for what's already a degraded environment.
  }
}

export function disableDemoMode(): void {
  if (!hasSessionStorage()) return;
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // See enableDemoMode.
  }
}
