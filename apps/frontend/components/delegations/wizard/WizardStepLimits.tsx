"use client";

import { useTranslations } from "next-intl";
import { FormField, StroopsInput } from "@delegolabs/ui";

export interface WizardStepLimitsProps {
  maxPerTransaction: string;
  onMaxPerTransactionChange: (stroops: string) => void;
  maxTotal: string;
  onMaxTotalChange: (stroops: string) => void;
  expiresAt: string;
  onExpiresAtChange: (value: string) => void;
  maxTotalError?: string;
}

/** Step 3 — spending limits and expiry (#523). */
export function WizardStepLimits({
  maxPerTransaction,
  onMaxPerTransactionChange,
  maxTotal,
  onMaxTotalChange,
  expiresAt,
  onExpiresAtChange,
  maxTotalError,
}: WizardStepLimitsProps) {
  const t = useTranslations("delegations.wizard");

  return (
    <div className="settings-section">
      <div>
        <label style={{ display: "block", fontWeight: 500, marginBottom: "0.5rem" }}>
          {t("maxPerTransaction.label")}
        </label>
        <StroopsInput
          value={BigInt(maxPerTransaction || "0")}
          onChange={(stroops) => onMaxPerTransactionChange(stroops.toString())}
          style={{ width: "100%" }}
        />
      </div>

      <div>
        <label style={{ display: "block", fontWeight: 500, marginBottom: "0.5rem" }}>
          {t("maxTotal.label")}
        </label>
        <StroopsInput
          value={BigInt(maxTotal || "0")}
          onChange={(stroops) => onMaxTotalChange(stroops.toString())}
          error={maxTotalError && t("errors.invalidTotal")}
          style={{ width: "100%" }}
        />
      </div>

      <FormField
        label={t("expiresAt.label")}
        hint={t("expiresAt.hint")}
        inputProps={{
          type: "date",
          value: expiresAt,
          onChange: (e) => onExpiresAtChange(e.target.value),
          style: { width: "100%" },
        }}
      />
    </div>
  );
}
