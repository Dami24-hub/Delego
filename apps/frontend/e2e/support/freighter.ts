import type { Page } from "@playwright/test";
import { E2E_WALLET_ADDRESS } from "./fixtures";

/**
 * Injects a synthetic `window.freighter` object before any page script runs
 * (FE-044). `@stellar/freighter-api` reads `window.freighter` directly (see
 * node_modules/@stellar/freighter-api/build/index.min.js) rather than talking
 * to the real browser extension, so this makes wallet flows deterministic in
 * CI without installing Freighter.
 */
export async function stubFreighter(page: Page, address = E2E_WALLET_ADDRESS) {
  await page.addInitScript(
    ({ address: addr }) => {
      (window as unknown as { freighter: unknown }).freighter = {
        isConnected: async () => ({ isConnected: true }),
        isAllowed: async () => ({ isAllowed: true }),
        getAddress: async () => ({ address: addr }),
        getNetwork: async () => ({
          network: "TESTNET",
          networkPassphrase: "Test SDF Network ; September 2015",
        }),
        requestAccess: async () => ({ address: addr }),
        signTransaction: async () => ({ signedTxXdr: "MOCK_SIGNED_XDR" }),
      };
    },
    { address }
  );
}
