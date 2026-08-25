import { describe, it, expect } from "vitest";
import { filterMerchants, type DirectoryMerchant } from "./merchantDirectory";

const MERCHANTS: DirectoryMerchant[] = [
  { id: "merchant-a", name: "Acme Groceries" },
  { id: "merchant-b", name: "Bolt Electronics" },
  { id: "merchant-c", name: "Corner Cafe" },
];

describe("filterMerchants", () => {
  it("returns every merchant when the search is empty", () => {
    expect(filterMerchants(MERCHANTS, "")).toEqual(MERCHANTS);
    expect(filterMerchants(MERCHANTS, "   ")).toEqual(MERCHANTS);
  });

  it("matches case-insensitively against the merchant name", () => {
    expect(filterMerchants(MERCHANTS, "acme")).toEqual([MERCHANTS[0]]);
  });

  it("matches against the merchant id", () => {
    expect(filterMerchants(MERCHANTS, "merchant-b")).toEqual([MERCHANTS[1]]);
  });

  it("returns an empty list when nothing matches", () => {
    expect(filterMerchants(MERCHANTS, "nonexistent")).toEqual([]);
  });
});
