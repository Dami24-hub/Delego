import { formatAmount, type FormatAmountContext } from "./formatAmount.js";

export interface AmountProps extends FormatAmountContext {
  /** Amount in stroops */
  stroops: bigint;
}

/**
 * Renders a stroops amount using the active display-currency preference
 * (FE-039). Shows the alternate unit as a tooltip (`title`) when converting,
 * so the underlying XLM value is always one hover away.
 */
export function Amount({ stroops, ...context }: AmountProps) {
  const { value, symbol, alternate } = formatAmount(stroops, context);

  return (
    <span title={alternate || undefined}>
      {value}
      {symbol && ` ${symbol}`}
    </span>
  );
}
