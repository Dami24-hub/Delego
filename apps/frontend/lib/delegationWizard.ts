import type { CreateDelegationInput, DelegationPermissionLevel } from "@delegolabs/types";

export const DELEGATION_WIZARD_STEPS = ["agent", "scope", "limits", "review"] as const;
export type DelegationWizardStepId = (typeof DELEGATION_WIZARD_STEPS)[number];

/** Editable wizard state — a superset of `CreateDelegationInput` shaped for form controls (bigint amounts, csv strings). */
export interface DelegationWizardDraft {
  agentId: string;
  walletId: string;
  label: string;
  permissionLevel: DelegationPermissionLevel;
  maxPerTransaction: string;
  maxTotal: string;
  allowedMerchants: string[];
  unrestrictedMerchants: boolean;
  allowedCategories: string;
  expiresAt: string;
}

export function createEmptyDraft(defaultWalletId = ""): DelegationWizardDraft {
  return {
    agentId: "",
    walletId: defaultWalletId,
    label: "",
    permissionLevel: "AUTO_APPROVE",
    maxPerTransaction: "0",
    maxTotal: "0",
    allowedMerchants: [],
    unrestrictedMerchants: true,
    allowedCategories: "",
    expiresAt: "",
  };
}

function parseCsv(value: string): string[] {
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** True once the draft has diverged from an empty draft with the same default wallet — used to gate the cancel-confirmation. */
export function isDraftDirty(draft: DelegationWizardDraft, defaultWalletId = ""): boolean {
  const empty = createEmptyDraft(defaultWalletId);
  return JSON.stringify(draft) !== JSON.stringify(empty);
}

export interface DraftValidationErrors {
  agentId?: string;
  walletId?: string;
  label?: string;
  maxTotal?: string;
  allowedMerchants?: string;
}

/** Per-step validation so each wizard step can be validated independently. */
export function validateStep(
  step: DelegationWizardStepId,
  draft: DelegationWizardDraft
): DraftValidationErrors {
  const errors: DraftValidationErrors = {};

  if (step === "agent") {
    if (!draft.agentId.trim()) errors.agentId = "missingAgentId";
  }
  if (step === "scope") {
    if (!draft.walletId.trim()) errors.walletId = "missingWalletId";
    if (!draft.label.trim()) errors.label = "missingLabel";
    if (!draft.unrestrictedMerchants && draft.allowedMerchants.length === 0) {
      errors.allowedMerchants = "emptyWhitelist";
    }
  }
  if (step === "limits") {
    if (BigInt(draft.maxTotal || "0") <= 0n) errors.maxTotal = "invalidTotal";
  }

  return errors;
}

export function draftToCreateInput(draft: DelegationWizardDraft): CreateDelegationInput {
  return {
    agentId: draft.agentId.trim(),
    walletId: draft.walletId.trim(),
    label: draft.label.trim(),
    permissionLevel: draft.permissionLevel,
    policy: {
      maxPerTransaction: draft.maxPerTransaction,
      maxTotal: draft.maxTotal,
      allowedMerchants: draft.unrestrictedMerchants ? [] : draft.allowedMerchants,
      allowedCategories: parseCsv(draft.allowedCategories),
      ...(draft.expiresAt && { expiresAt: new Date(draft.expiresAt).toISOString() }),
    },
  };
}
