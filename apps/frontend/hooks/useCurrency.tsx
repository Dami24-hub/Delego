"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import {
  CURRENCIES,
  CURRENCY_STORAGE_KEY,
  DEFAULT_CURRENCY_ID,
  getCurrencyConfig,
  isCurrencyId,
  type CurrencyConfig,
  type CurrencyId,
} from "../lib/currencies";
import { fetchXlmRate, isRateStale, type RateSnapshot } from "../lib/rates";

interface CurrencyContextValue {
  /** The active display-currency id */
  currencyId: CurrencyId;
  /** Full config for the active currency */
  currency: CurrencyConfig;
  /** All selectable currencies */
  currencies: CurrencyConfig[];
  /** Switch the active display currency (persisted to localStorage) */
  setCurrency: (id: CurrencyId) => void;
  /** Latest XLM/USD rate snapshot, used by estimate modes */
  rate: RateSnapshot | null;
  /** True when `rate` is the static fallback or older than the staleness window */
  rateIsStale: boolean;
  /** True once the persisted value has been read on the client */
  hydrated: boolean;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

/**
 * Provides the active display-currency preference to the whole app (FE-039).
 *
 * Mirrors hooks/useNetwork.tsx: the selection is persisted in localStorage,
 * read after mount to avoid hydration drift, and synced across tabs. When an
 * estimate mode (USDC/USD) is active, also fetches and caches the XLM rate
 * (see lib/rates.ts) so formatAmount can convert.
 */
export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currencyId, setCurrencyId] = useState<CurrencyId>(DEFAULT_CURRENCY_ID);
  const [hydrated, setHydrated] = useState(false);
  const [rate, setRate] = useState<RateSnapshot | null>(null);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(CURRENCY_STORAGE_KEY);
      if (stored && isCurrencyId(stored)) {
        setCurrencyId(stored);
      }
    } catch {
      // localStorage may be unavailable (private mode) — keep the default.
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    function onStorage(event: StorageEvent) {
      if (event.key === CURRENCY_STORAGE_KEY && event.newValue) {
        if (isCurrencyId(event.newValue)) {
          setCurrencyId(event.newValue);
        }
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const isEstimateMode = CURRENCIES[currencyId].isEstimate;

  useEffect(() => {
    if (!isEstimateMode) return;
    const controller = new AbortController();
    fetchXlmRate(controller.signal).then(setRate);
    return () => controller.abort();
  }, [isEstimateMode]);

  const setCurrency = useCallback((id: CurrencyId) => {
    setCurrencyId(id);
    try {
      window.localStorage.setItem(CURRENCY_STORAGE_KEY, id);
    } catch {
      // Ignore persistence failures — the in-memory value still updates.
    }
  }, []);

  const value = useMemo<CurrencyContextValue>(
    () => ({
      currencyId,
      currency: getCurrencyConfig(currencyId),
      currencies: Object.values(CURRENCIES),
      setCurrency,
      rate,
      rateIsStale: rate ? isRateStale(rate) : false,
      hydrated,
    }),
    [currencyId, setCurrency, rate, hydrated]
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

/** Access the active display-currency preference. Must be used within a CurrencyProvider. */
export function useCurrency(): CurrencyContextValue {
  const ctx = useContext(CurrencyContext);
  if (!ctx) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return ctx;
}
