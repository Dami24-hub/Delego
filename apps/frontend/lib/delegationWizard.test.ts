import { describe, it, expect } from "vitest";
import {
  createEmptyDraft,
  draftToCreateInput,
  isDraftDirty,
  validateStep,
} from "./delegationWizard";

describe("createEmptyDraft", () => {
  it("seeds the wallet field from the default wallet id", () => {
    const draft = createEmptyDraft("wallet-1");
    expect(draft.walletId).toBe("wallet-1");
    expect(draft.agentId).toBe("");
    expect(draft.unrestrictedMerchants).toBe(true);
  });
});

describe("isDraftDirty", () => {
  it("is false for a freshly created draft", () => {
    const draft = createEmptyDraft("wallet-1");
    expect(isDraftDirty(draft, "wallet-1")).toBe(false);
  });

  it("is true once any field diverges", () => {
    const draft = { ...createEmptyDraft("wallet-1"), agentId: "agent-1" };
    expect(isDraftDirty(draft, "wallet-1")).toBe(true);
  });
});

describe("validateStep", () => {
  it("requires an agent id on the agent step", () => {
    const draft = createEmptyDraft();
    expect(validateStep("agent", draft).agentId).toBe("missingAgentId");
    expect(
      validateStep("agent", { ...draft, agentId: "agent-1" }).agentId
    ).toBeUndefined();
  });

  it("requires wallet, label, and a non-empty whitelist on the scope step", () => {
    const draft = createEmptyDraft();
    const errors = validateStep("scope", draft);
    expect(errors.walletId).toBe("missingWalletId");
    expect(errors.label).toBe("missingLabel");
    expect(errors.allowedMerchants).toBeUndefined(); // unrestricted by default

    const restricted = {
      ...draft,
      walletId: "w",
      label: "l",
      unrestrictedMerchants: false,
    };
    expect(validateStep("scope", restricted).allowedMerchants).toBe(
      "emptyWhitelist"
    );
  });

  it("requires a positive total on the limits step", () => {
    const draft = createEmptyDraft();
    expect(validateStep("limits", draft).maxTotal).toBe("invalidTotal");
    expect(
      validateStep("limits", { ...draft, maxTotal: "100" }).maxTotal
    ).toBeUndefined();
  });

  it("has no errors on the review step", () => {
    expect(validateStep("review", createEmptyDraft())).toEqual({});
  });
});

describe("draftToCreateInput", () => {
  it("matches the review summary's numbers exactly", () => {
    const draft = {
      agentId: " agent-groceries ",
      walletId: " wallet-1 ",
      label: " Groceries agent ",
      permissionLevel: "AUTO_APPROVE" as const,
      maxPerTransaction: "10000000",
      maxTotal: "500000000",
      allowedMerchants: [],
      unrestrictedMerchants: true,
      allowedCategories: "groceries, food",
      expiresAt: "2026-09-01",
    };

    const input = draftToCreateInput(draft);

    expect(input.agentId).toBe("agent-groceries");
    expect(input.walletId).toBe("wallet-1");
    expect(input.label).toBe("Groceries agent");
    expect(input.policy.maxPerTransaction).toBe("10000000");
    expect(input.policy.maxTotal).toBe("500000000");
    expect(input.policy.allowedMerchants).toEqual([]);
    expect(input.policy.allowedCategories).toEqual(["groceries", "food"]);
    expect(input.policy.expiresAt).toBe(new Date("2026-09-01").toISOString());
  });

  it("keeps the whitelist when merchants are restricted", () => {
    const draft = {
      ...createEmptyDraft(),
      unrestrictedMerchants: false,
      allowedMerchants: ["merchant-a", "merchant-b"],
    };
    const input = draftToCreateInput(draft);
    expect(input.policy.allowedMerchants).toEqual(["merchant-a", "merchant-b"]);
  });

  it("omits expiresAt entirely when not set", () => {
    const input = draftToCreateInput(createEmptyDraft());
    expect(input.policy.expiresAt).toBeUndefined();
  });
});
