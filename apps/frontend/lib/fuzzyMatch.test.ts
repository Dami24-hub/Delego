import { describe, it, expect } from "vitest";
import { bestFuzzyScore, fuzzyScore } from "./fuzzyMatch";

describe("fuzzyScore", () => {
  it("returns 0 for an empty query", () => {
    expect(fuzzyScore("", "Delegations")).toBe(0);
  });

  it("scores exact substrings higher the earlier they appear", () => {
    const early = fuzzyScore("del", "Delegations");
    const late = fuzzyScore("del", "New delegation");
    expect(early).not.toBeNull();
    expect(late).not.toBeNull();
    expect(early!).toBeGreaterThan(late!);
  });

  it("matches out-of-order-free subsequences", () => {
    expect(fuzzyScore("dlgtn", "delegation")).not.toBeNull();
  });

  it("returns null when the query isn't a subsequence", () => {
    expect(fuzzyScore("xyz", "delegation")).toBeNull();
  });

  it("is case-insensitive", () => {
    expect(fuzzyScore("DEL", "delegations")).not.toBeNull();
  });
});

describe("bestFuzzyScore", () => {
  it("picks the best score across candidates and skips undefined", () => {
    const score = bestFuzzyScore("ord", [undefined, "/settings", "Orders"]);
    expect(score).not.toBeNull();
  });

  it("returns null when nothing matches", () => {
    expect(bestFuzzyScore("zzz", ["Orders", "/orders"])).toBeNull();
  });
});
