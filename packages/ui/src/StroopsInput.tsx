import type { InputHTMLAttributes } from "react";
import { useState } from "react";

export interface StroopsInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "onChange" | "value"
> {
  /** Current value in stroops (bigint) */
  value?: bigint;
  /** Callback when value changes - emits stroops as bigint */
  onChange?: (stroops: bigint) => void;
  /** Currency symbol to display (default: 'XLM') */
  currencySymbol?: string;
  /** Number of decimal places for stroops conversion (default: 7) */
  decimals?: number;
  /** Error message to display */
  error?: string;
}

/** Utility to convert stroops to XLM display value */
function stroopsToXlm(stroops: bigint, decimals: number = 7): string {
  const divisor = 10 ** decimals;
  const xlmAmount = Number(stroops) / divisor;
  return xlmAmount.toFixed(decimals).replace(/\.?0+$/, "");
}

/** Utility to convert XLM display value to stroops */
function xlmToSroops(xlmStr: string, decimals: number = 7): bigint {
  if (!xlmStr || xlmStr === ".") return 0n;

  try {
    const parts = xlmStr.split(".");
    const wholePart = parts[0] || "0";
    const fractionalPart = (parts[1] || "")
      .padEnd(decimals, "0")
      .slice(0, decimals);

    const stroopsStr = wholePart + fractionalPart.padStart(decimals, "0");
    return BigInt(stroopsStr);
  } catch {
    return 0n;
  }
}

/** Input component for XLM/Stroops conversion with validation */
export function StroopsInput({
  value,
  onChange,
  currencySymbol = "XLM",
  decimals = 7,
  error,
  disabled,
  ...props
}: StroopsInputProps) {
  const [internalValue, setInternalValue] = useState<string>("");
  const isControlled = value !== undefined;
  const displayValue = isControlled
    ? stroopsToXlm(value, decimals)
    : internalValue;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;

    if (inputValue === "" || inputValue === ".") {
      if (!isControlled) setInternalValue("");
      onChange?.(0n);
      return;
    }

    if (!/^\d*\.?\d*$/.test(inputValue)) {
      return;
    }

    if (inputValue.includes(".")) {
      const [, fractional] = inputValue.split(".");
      if (fractional && fractional.length > decimals) {
        return;
      }
    }

    if (!isControlled) setInternalValue(inputValue);
    const stroops = xlmToSroops(inputValue, decimals);
    onChange?.(stroops);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (e.target.value && e.target.value !== ".") {
      const stroops = xlmToSroops(e.target.value, decimals);
      const formatted = stroopsToXlm(stroops, decimals);
      if (!isControlled) setInternalValue(formatted);
      e.target.value = formatted;
    }
    props.onBlur?.(e);
  };

  return (
    <div style={{ position: "relative" }}>
      <input
        type="text"
        inputMode="decimal"
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        disabled={disabled}
        aria-label={`Amount in ${currencySymbol}`}
        aria-invalid={!!error}
        {...props}
        style={{
          ...props.style,
          paddingRight: "3rem",
        }}
      />
      <div
        style={{
          position: "absolute",
          right: "0.75rem",
          top: "50%",
          transform: "translateY(-50%)",
          pointerEvents: "none",
          color: "#666",
          fontSize: "0.875rem",
          fontWeight: 500,
        }}
      >
        {currencySymbol}
      </div>
      {error && (
        <div
          role="alert"
          style={{
            fontSize: "0.875rem",
            color: "#dc2626",
            marginTop: "0.25rem",
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}
