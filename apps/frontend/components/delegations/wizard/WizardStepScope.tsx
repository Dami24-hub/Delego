"use client";

import { useTranslations } from "next-intl";
import { FormField } from "@delegolabs/ui";
import type { DelegationPermissionLevel } from "@delegolabs/types";
import { MerchantWhitelistPicker } from "../MerchantWhitelistPicker";

const PERMISSION_LEVELS: DelegationPermissionLevel[] = [
  "VIEW_ONLY",
  "AUTO_APPROVE",
  "SIGNER",
  "ADMIN",
];

export interface WizardStepScopeProps {
  walletId: string;
  onWalletIdChange: (value: string) => void;
  label: string;
  onLabelChange: (value: string) => void;
  permissionLevel: DelegationPermissionLevel;
  onPermissionLevelChange: (value: DelegationPermissionLevel) => void;
  allowedCategories: string;
  onAllowedCategoriesChange: (value: string) => void;
  allowedMerchants: string[];
  onAllowedMerchantsChange: (value: string[]) => void;
  unrestrictedMerchants: boolean;
  onUnrestrictedMerchantsChange: (value: boolean) => void;
  errors: { walletId?: string; label?: string; allowedMerchants?: string };
}

/** Step 2 — task categories and merchant restrictions (#523). */
export function WizardStepScope({
  walletId,
  onWalletIdChange,
  label,
  onLabelChange,
  permissionLevel,
  onPermissionLevelChange,
  allowedCategories,
  onAllowedCategoriesChange,
  allowedMerchants,
  onAllowedMerchantsChange,
  unrestrictedMerchants,
  onUnrestrictedMerchantsChange,
  errors,
}: WizardStepScopeProps) {
  const t = useTranslations("delegations.wizard");
  const tForms = useTranslations("forms");

  return (
    <div className="settings-section">
      <FormField
        label={t("walletId.label")}
        required
        hint={t("walletId.hint")}
        error={errors.walletId && t("errors.missingFields")}
        inputProps={{
          value: walletId,
          onChange: (e) => onWalletIdChange(e.target.value),
          placeholder: t("walletId.placeholder"),
          style: { width: "100%" },
        }}
      />

      <FormField
        label={t("label.label")}
        required
        hint={t("label.hint")}
        error={errors.label && t("errors.missingFields")}
        inputProps={{
          value: label,
          onChange: (e) => onLabelChange(e.target.value),
          placeholder: t("label.placeholder"),
          style: { width: "100%" },
        }}
      />

      <div>
        <label
          htmlFor="wizard-permission-level"
          style={{ display: "block", fontWeight: 500, marginBottom: "0.5rem" }}
        >
          {t("permissionLevel.label")}
        </label>
        <select
          id="wizard-permission-level"
          value={permissionLevel}
          onChange={(e) =>
            onPermissionLevelChange(e.target.value as DelegationPermissionLevel)
          }
          style={{ width: "100%", padding: "0.5rem", borderRadius: "0.375rem" }}
        >
          {PERMISSION_LEVELS.map((level) => (
            <option key={level} value={level}>
              {level.replace("_", " ")}
            </option>
          ))}
        </select>
      </div>

      <FormField
        label={t("allowedCategories.label")}
        hint={tForms("commaSeparatedHint")}
        inputProps={{
          value: allowedCategories,
          onChange: (e) => onAllowedCategoriesChange(e.target.value),
          placeholder: t("allowedCategories.placeholder"),
          style: { width: "100%" },
        }}
      />

      <div>
        <label
          style={{ display: "block", fontWeight: 500, marginBottom: "0.5rem" }}
        >
          {t("allowedMerchants.label")}
        </label>
        <MerchantWhitelistPicker
          value={allowedMerchants}
          onChange={onAllowedMerchantsChange}
          unrestricted={unrestrictedMerchants}
          onUnrestrictedChange={onUnrestrictedMerchantsChange}
          showEmptyWhitelistError={Boolean(errors.allowedMerchants)}
        />
      </div>
    </div>
  );
}
