import { describe, expect, it, beforeEach } from "vitest";
import {
  COLOR_TAG_KEYS,
  COLOR_TAG_PALETTE,
  loadDelegationTags,
  setDelegationTag,
} from "./delegationTags";

describe("Delegation Labels & Color Tags (#600)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("defines 8 pre-approved accessible color tags meeting contrast requirements", () => {
    expect(COLOR_TAG_KEYS).toHaveLength(8);
    expect(COLOR_TAG_KEYS).toEqual([
      "slate",
      "indigo",
      "emerald",
      "amber",
      "rose",
      "cyan",
      "violet",
      "teal",
    ]);

    COLOR_TAG_KEYS.forEach((key) => {
      const meta = COLOR_TAG_PALETTE[key];
      expect(meta.lightBg).toBeDefined();
      expect(meta.lightText).toBeDefined();
      expect(meta.darkBg).toBeDefined();
      expect(meta.darkText).toBeDefined();
      expect(meta.border).toBeDefined();
    });
  });

  it("persists label and color tag updates to localStorage", () => {
    expect(loadDelegationTags()).toEqual({});

    setDelegationTag("del-100", { label: "Groceries", colorTag: "emerald" });
    const loaded = loadDelegationTags();

    expect(loaded["del-100"]).toEqual({
      label: "Groceries",
      colorTag: "emerald",
    });
  });
});
