/**
 * Display-currency preference definitions (FE-039).
 *
 * Balances are always stored/transacted in stroops (1 XLM = 10,000,000
 * stroops); this only controls how amounts are *displayed*. The active
 * choice is persisted in localStorage and shared through CurrencyProvider
 * (see hooks/useCurrency.tsx), mirroring the NetworkProvider pattern in
 * hooks/useNetwork.tsx / lib/networks.ts.
 */

export type CurrencyId = "XLM" | "USDC_ESTIMATE" | "USD";

export interface CurrencyConfig {
  id: CurrencyId;
  /** Human-readable label shown in the settings dropdown */
  label: string;
  /** Short symbol/suffix used inline next to amounts */
  symbol: string;
  /** True when this mode converts via a fetched XLM rate rather than showing raw XLM */
  isEstimate: boolean;
}

export const CURRENCIES: Record<CurrencyId, CurrencyConfig> = {
  XLM: {
    id: "XLM",
    label: "XLM",
    symbol: "XLM",
    isEstimate: false,
  },
  USDC_ESTIMATE: {
    id: "USDC_ESTIMATE",
    label: "USDC-equivalent estimate",
    symbol: "USDC",
    isEstimate: true,
  },
  USD: {
    id: "USD",
    label: "USD",
    symbol: "$",
    isEstimate: true,
  },
};

export const CURRENCY_IDS = Object.keys(CURRENCIES) as CurrencyId[];

/** localStorage key holding the user's display-currency selection. */
export const CURRENCY_STORAGE_KEY = "delego_display_currency";

export const DEFAULT_CURRENCY_ID: CurrencyId = "XLM";

export function isCurrencyId(value: string): value is CurrencyId {
  return value in CURRENCIES;
}

export function getCurrencyConfig(id: CurrencyId): CurrencyConfig {
  return CURRENCIES[id];
}
