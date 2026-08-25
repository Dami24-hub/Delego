const STROOPS_PER_XLM = 10_000_000n;

export interface FormatAmountContext {
  /** BCP-47 locale for Intl.NumberFormat (thousands separators, decimal style) */
  locale?: string;
  /** Display currency: "XLM" shows raw XLM; "USD"/"USDC_ESTIMATE" convert via `xlmUsdRate`. */
  currency?: "XLM" | "USD" | "USDC_ESTIMATE";
  /** USD value of 1 XLM — required (and used) only when `currency` is an estimate mode. */
  xlmUsdRate?: number;
}

export interface FormattedAmount {
  /** The formatted amount string, without the unit/symbol (e.g. "1,234.56") */
  value: string;
  /** Unit/symbol to render alongside `value` (e.g. "XLM", "$") */
  symbol: string;
  /** Alternate-unit string for a tooltip (e.g. XLM amount when displaying a USD estimate) */
  alternate: string;
}

function xlmFromStroops(stroops: bigint): number {
  return Number(stroops) / Number(STROOPS_PER_XLM);
}

/**
 * Formats a stroops amount for display, honoring the user's display-currency
 * preference (FE-039). Pure/side-effect-free so it's usable in both React
 * components and plain formatting call sites (tables, tooltips).
 *
 * Precision note: stroops amounts are converted via `Number` (not kept as
 * bigint) once display formatting is involved, since Intl.NumberFormat only
 * accepts number/bigint-as-integer and XLM amounts need fractional digits.
 * This is safe up to Number.MAX_SAFE_INTEGER stroops (~900M XLM) — well
 * beyond any realistic delegation/order amount in this app.
 */
export function formatAmount(
  stroops: bigint,
  context: FormatAmountContext = {}
): FormattedAmount {
  const { locale, currency = "XLM", xlmUsdRate } = context;
  const xlm = xlmFromStroops(stroops);
  const xlmFormatted = xlm.toLocaleString(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  if (currency === "XLM" || !xlmUsdRate) {
    return { value: xlmFormatted, symbol: "XLM", alternate: "" };
  }

  const usdValue = xlm * xlmUsdRate;
  const usdFormatted =
    currency === "USD"
      ? usdValue.toLocaleString(locale, { style: "currency", currency: "USD" })
      : usdValue.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return {
    value: usdFormatted,
    symbol: currency === "USD" ? "" : "USDC",
    alternate: `${xlmFormatted} XLM`,
  };
}

/** Stroops helper-text for an amount input (e.g. "1,500,000 stroops"). */
export function stroopsHelperText(stroops: bigint, locale?: string): string {
  return `${stroops.toLocaleString(locale)} stroops`;
}
