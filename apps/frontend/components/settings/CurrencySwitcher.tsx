"use client";

import { Card } from "@delegolabs/ui";
import { useCurrency } from "../../hooks/useCurrency";
import type { CurrencyId } from "../../lib/currencies";

/**
 * Display-currency preference switcher (FE-039). Mirrors
 * components/settings/LanguageSwitcher.tsx: a Card-wrapped select persisted
 * via CurrencyProvider (localStorage, no server round-trip needed since this
 * only affects client-side formatting).
 */
export function CurrencySwitcher() {
  const { currencyId, currencies, setCurrency, rate, rateIsStale } =
    useCurrency();
  const isEstimateMode = currencyId !== "XLM";

  return (
    <Card title="Display currency" ariaLabel="Display currency">
      <div className="settings-section">
        <label
          htmlFor="currency-select"
          style={{ display: "block", fontWeight: 500, marginBottom: "0.5rem" }}
        >
          Display currency
        </label>
        <p
          style={{ fontSize: "0.875rem", color: "#666", margin: "0 0 0.5rem" }}
        >
          Choose how amounts are displayed across the app. Balances are always
          held and transacted in XLM.
        </p>
        <select
          id="currency-select"
          value={currencyId}
          onChange={(e) => setCurrency(e.target.value as CurrencyId)}
          style={{ width: "100%", padding: "0.5rem", borderRadius: "0.375rem" }}
        >
          {currencies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
        {isEstimateMode && rate && rateIsStale && (
          <p
            role="status"
            style={{
              fontSize: "0.8125rem",
              color: "#92400e",
              marginTop: "0.5rem",
            }}
          >
            Showing a {rate.isFallback ? "placeholder" : "cached"} exchange rate
            — live rates are unavailable right now.
          </p>
        )}
      </div>
    </Card>
  );
}
