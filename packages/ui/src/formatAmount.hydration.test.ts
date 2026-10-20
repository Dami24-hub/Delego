/**
 * Hydration stability tests for formatAmount
 * Ensures balance formatting works identically on server and client
 */

import { describe, it, expect } from "vitest";
import { formatAmount, stroopsHelperText } from "./formatAmount.js";

/**
 * Hydration stability requirement:
 * Server and client must render identical text content to avoid React hydration warnings.
 * 
 * Current implementation uses undefined locale which causes mismatch:
 * - Server (e.g., en-US default): "100.00"
 * - Client (e.g., de-DE): "100,00"
 * 
 * Solution: Pass explicit locale to formatAmount, or use skeleton placeholders
 */

describe("formatAmount hydration stability", () => {
  it("formats with explicit locale consistently", () => {
    const stroops = 1_000_000_000n;
    const locale = "en-US";

    // Server and client both use same explicit locale
    const serverResult = formatAmount(stroops, { locale });
    const clientResult = formatAmount(stroops, { locale });

    expect(serverResult).toEqual(clientResult);
    expect(serverResult.value).toBe("100.00");
    expect(serverResult.symbol).toBe("XLM");
  });

  it("prevents mismatch with deterministic locale selection", () => {
    const stroops = 12_345_678n;
    const locale = "en-US";

    // Using explicit locale prevents locale-based mismatch
    const result = formatAmount(stroops, { locale });

    expect(result.value).toBe("1.23");
    expect(result.symbol).toBe("XLM");
  });

  it("formats large amounts with explicit locale", () => {
    // 50,000 XLM
    const stroops = 500_000_000_000n;
    const locale = "en-US";

    const result = formatAmount(stroops, { locale });

    expect(result.value).toBe("50,000.00");
  });

  it("formats with different locale explicitly", () => {
    const stroops = 12_345_678n;
    const locale = "de-DE";

    const result = formatAmount(stroops, { locale });

    // German locale uses dot for thousands, comma for decimal
    expect(result.value).toBe("1,23");
    expect(result.symbol).toBe("XLM");
  });
});

describe("stroopsHelperText hydration stability", () => {
  it("formats with explicit locale", () => {
    const locale = "en-US";
    const result = stroopsHelperText(1_500_000n, locale);

    expect(result).toBe("1,500,000 stroops");
  });

  it("formats with German locale", () => {
    const locale = "de-DE";
    const result = stroopsHelperText(1_500_000n, locale);

    expect(result).toBe("1.500.000 stroops");
  });
});

describe("formatAmount with currency conversion hydration stability", () => {
  it("formats USD estimate consistently", () => {
    const stroops = 1_000_000_000n;
    const locale = "en-US";
    const xlmUsdRate = 0.12;

    const serverResult = formatAmount(stroops, { currency: "USD", xlmUsdRate, locale });
    const clientResult = formatAmount(stroops, { currency: "USD", xlmUsdRate, locale });

    expect(serverResult).toEqual(clientResult);
    expect(serverResult.value).toBe("$12.00");
    expect(serverResult.symbol).toBe("");
    expect(serverResult.alternate).toBe("100.00 XLM");
  });

  it("formats USDC estimate consistently", () => {
    const stroops = 1_000_000_000n;
    const locale = "en-US";
    const xlmUsdRate = 0.12;

    const serverResult = formatAmount(stroops, {
      currency: "USDC_ESTIMATE",
      xlmUsdRate,
      locale,
    });
    const clientResult = formatAmount(stroops, {
      currency: "USDC_ESTIMATE",
      xlmUsdRate,
      locale,
    });

    expect(serverResult).toEqual(clientResult);
    expect(serverResult.value).toBe("12.00");
    expect(serverResult.symbol).toBe("USDC");
  });
});

describe("hydration mismatch patterns for server-side rendering", () => {
  it("demonstrates pattern for stable SSR", () => {
    // Server uses user's locale preference (stored in cookie or session)
    const userLocale = "en-US";
    const stroops = 1_000_000_000n;

    const serverFormatted = formatAmount(stroops, { locale: userLocale });

    // Client must use same locale to avoid mismatch
    const clientFormatted = formatAmount(stroops, { locale: userLocale });

    expect(serverFormatted.value).toBe(clientFormatted.value);
    expect(serverFormatted.symbol).toBe(clientFormatted.symbol);
  });

  it("shows what causes hydration mismatch", () => {
    const stroops = 1_000_000_000n;

    // Server with default locale (undefined -> system default)
    const serverFormatted = formatAmount(stroops);

    // Client with user's browser locale
    const clientFormatted = formatAmount(stroops, { locale: "de-DE" });

    // These will differ causing hydration mismatch:
    // Server: "100.00"  Client: "100,00"
    // Don't compare directly - the test is showing the problem
    expect(typeof serverFormatted.value).toBe("string");
    expect(typeof clientFormatted.value).toBe("string");
  });
});