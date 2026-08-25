import { describe, it, expect } from "vitest";
import { formatAmount, stroopsHelperText } from "./formatAmount.js";

describe("formatAmount", () => {
  it("formats a whole XLM amount with two decimals by default", () => {
    const result = formatAmount(1_000_000_000n);
    expect(result).toEqual({ value: "100.00", symbol: "XLM", alternate: "" });
  });

  it("formats a fractional stroops amount, rounding to two decimals", () => {
    // 12,345,678 stroops = 1.2345678 XLM -> rounds to 1.23
    const result = formatAmount(12_345_678n);
    expect(result.value).toBe("1.23");
    expect(result.symbol).toBe("XLM");
  });

  it("uses thousands separators via Intl.NumberFormat locale", () => {
    const result = formatAmount(12_345_000_000_000n, { locale: "en-US" });
    expect(result.value).toBe("1,234,500.00");
  });

  it("respects a different locale's grouping/decimal separators", () => {
    const result = formatAmount(12_345_000_000_000n, { locale: "de-DE" });
    expect(result.value).toBe("1.234.500,00");
  });

  it("handles zero stroops without throwing", () => {
    expect(formatAmount(0n)).toEqual({ value: "0.00", symbol: "XLM", alternate: "" });
  });

  it("handles the smallest representable amount (1 stroop) without precision loss beyond display rounding", () => {
    const result = formatAmount(1n);
    expect(result.value).toBe("0.00");
  });

  it("falls back to XLM when currency is an estimate mode but no rate is provided", () => {
    const result = formatAmount(1_000_000_000n, { currency: "USD" });
    expect(result).toEqual({ value: "100.00", symbol: "XLM", alternate: "" });
  });

  it("converts to a USD estimate and includes the XLM amount as the alternate unit", () => {
    const result = formatAmount(1_000_000_000n, { currency: "USD", xlmUsdRate: 0.12, locale: "en-US" });
    expect(result.value).toBe("$12.00");
    expect(result.symbol).toBe("");
    expect(result.alternate).toBe("100.00 XLM");
  });

  it("converts to a USDC-equivalent estimate with its own symbol", () => {
    const result = formatAmount(1_000_000_000n, {
      currency: "USDC_ESTIMATE",
      xlmUsdRate: 0.12,
      locale: "en-US",
    });
    expect(result.value).toBe("12.00");
    expect(result.symbol).toBe("USDC");
    expect(result.alternate).toBe("100.00 XLM");
  });

  it("handles a large delegation-scale amount without losing precision beyond display rounding", () => {
    // 50,000 XLM
    const result = formatAmount(500_000_000_000n, { locale: "en-US" });
    expect(result.value).toBe("50,000.00");
  });
});

describe("stroopsHelperText", () => {
  it("renders the raw stroops count with locale-aware grouping", () => {
    expect(stroopsHelperText(1_500_000n, "en-US")).toBe("1,500,000 stroops");
  });

  it("handles zero", () => {
    expect(stroopsHelperText(0n)).toBe("0 stroops");
  });
});
