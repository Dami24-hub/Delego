"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Button, Card, FormField, StroopsInput } from "@delegolabs/ui";
import type {
  CreateDelegationInput,
  DelegationPermissionLevel,
} from "@delegolabs/types";
import { MerchantWhitelistPicker } from "./MerchantWhitelistPicker";

const PERMISSION_LEVELS: DelegationPermissionLevel[] = [
  "VIEW_ONLY",
  "AUTO_APPROVE",
  "SIGNER",
  "ADMIN",
];

function parseCsv(value: string): string[] {
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export interface DelegationFormProps {
  /** Wallet ID pre-filled from the connected wallet, if known */
  defaultWalletId?: string;
  /** Called with the new delegation payload. May be async (creation is optimistic either way). */
  onSubmit: (input: CreateDelegationInput) => void | Promise<unknown>;
  onCancel?: () => void;
}

/** Form for granting a new delegation to an AI agent. */
export function DelegationForm({
  defaultWalletId = "",
  onSubmit,
  onCancel,
}: DelegationFormProps) {
  const [agentId, setAgentId] = useState("");
  const [walletId, setWalletId] = useState(defaultWalletId);
  const [label, setLabel] = useState("");
  const [permissionLevel, setPermissionLevel] =
    useState<DelegationPermissionLevel>("AUTO_APPROVE");
  const [maxPerTransaction, setMaxPerTransaction] = useState<bigint>(0n);
  const [maxTotal, setMaxTotal] = useState<bigint>(0n);
  const [allowedMerchants, setAllowedMerchants] = useState<string[]>([]);
  const [unrestrictedMerchants, setUnrestrictedMerchants] = useState(true);
  const [showEmptyWhitelistError, setShowEmptyWhitelistError] = useState(false);
  const [allowedCategories, setAllowedCategories] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const t = useTranslations("delegations.wizard");
  const tCommon = useTranslations("common");
  const tForms = useTranslations("forms");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);

    if (!agentId.trim() || !walletId.trim() || !label.trim()) {
      setFormError(t("errors.missingFields"));
      return;
    }
    if (maxTotal <= 0n) {
      setFormError(t("errors.invalidTotal"));
      return;
    }
    if (!unrestrictedMerchants && allowedMerchants.length === 0) {
      setShowEmptyWhitelistError(true);
      setFormError(t("errors.emptyWhitelist"));
      return;
    }
    setShowEmptyWhitelistError(false);

    const input: CreateDelegationInput = {
      agentId: agentId.trim(),
      walletId: walletId.trim(),
      label: label.trim(),
      permissionLevel,
      policy: {
        maxPerTransaction: maxPerTransaction.toString(),
        maxTotal: maxTotal.toString(),
        allowedMerchants: unrestrictedMerchants ? [] : allowedMerchants,
        allowedCategories: parseCsv(allowedCategories),
        ...(expiresAt && {
          expiresAt: new Date(expiresAt).toISOString(),
        }),
      },
    };

    setSubmitting(true);
    try {
      await onSubmit(input);
      setAgentId("");
      setLabel("");
      setMaxPerTransaction(0n);
      setMaxTotal(0n);
      setAllowedMerchants([]);
      setUnrestrictedMerchants(true);
      setAllowedCategories("");
      setExpiresAt("");
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : t("errors.createFailed")
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card title={t("title")} ariaLabel={t("ariaLabel")}>
      <form className="settings-section" onSubmit={handleSubmit} noValidate>
        <FormField
          label={t("agentId.label")}
          required
          hint={t("agentId.hint")}
          inputProps={{
            value: agentId,
            onChange: (e) => setAgentId(e.target.value),
            placeholder: t("agentId.placeholder"),
            style: { width: "100%" },
          }}
        />

        <FormField
          label={t("walletId.label")}
          required
          hint={t("walletId.hint")}
          inputProps={{
            value: walletId,
            onChange: (e) => setWalletId(e.target.value),
            placeholder: t("walletId.placeholder"),
            style: { width: "100%" },
          }}
        />

        <FormField
          label={t("label.label")}
          required
          hint={t("label.hint")}
          inputProps={{
            value: label,
            onChange: (e) => setLabel(e.target.value),
            placeholder: t("label.placeholder"),
            style: { width: "100%" },
          }}
        />

        <div>
          <label htmlFor="permission-level" style={{ display: "block", fontWeight: 500, marginBottom: "0.5rem" }}>
            {t("permissionLevel.label")}
          </label>
          <select
            id="permission-level"
            value={permissionLevel}
            onChange={(e) =>
              setPermissionLevel(e.target.value as DelegationPermissionLevel)
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

        <div>
          <label style={{ display: "block", fontWeight: 500, marginBottom: "0.5rem" }}>
            {t("maxPerTransaction.label")}
          </label>
          <StroopsInput
            value={maxPerTransaction}
            onChange={setMaxPerTransaction}
            style={{ width: "100%" }}
          />
        </div>

        <div>
          <label style={{ display: "block", fontWeight: 500, marginBottom: "0.5rem" }}>
            {t("maxTotal.label")}
          </label>
          <StroopsInput
            value={maxTotal}
            onChange={setMaxTotal}
            style={{ width: "100%" }}
          />
        </div>

        <div>
          <label style={{ display: "block", fontWeight: 500, marginBottom: "0.5rem" }}>
            {t("allowedMerchants.label")}
          </label>
          <MerchantWhitelistPicker
            value={allowedMerchants}
            onChange={setAllowedMerchants}
            unrestricted={unrestrictedMerchants}
            onUnrestrictedChange={(next) => {
              setUnrestrictedMerchants(next);
              if (next) setShowEmptyWhitelistError(false);
            }}
            showEmptyWhitelistError={showEmptyWhitelistError}
          />
        </div>

        <FormField
          label={t("allowedCategories.label")}
          hint={tForms("commaSeparatedHint")}
          inputProps={{
            value: allowedCategories,
            onChange: (e) => setAllowedCategories(e.target.value),
            placeholder: t("allowedCategories.placeholder"),
            style: { width: "100%" },
          }}
        />

        <FormField
          label={t("expiresAt.label")}
          hint={t("expiresAt.hint")}
          inputProps={{
            type: "date",
            value: expiresAt,
            onChange: (e) => setExpiresAt(e.target.value),
            style: { width: "100%" },
          }}
        />

        {formError && (
          <div className="settings-status error" role="alert">
            {formError}
          </div>
        )}

        <div className="form-actions">
          <Button variant="primary" type="submit" disabled={submitting}>
            {submitting ? t("submitting") : t("submit")}
          </Button>
          {onCancel && (
            <Button variant="ghost" type="button" onClick={onCancel}>
              {tCommon("cancel")}
            </Button>
          )}
        </div>
      </form>
    </Card>
  );
}
