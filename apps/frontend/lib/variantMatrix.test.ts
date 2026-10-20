import { describe, expect, it } from "vitest";
import {
  MAX_SKU_VARIANTS,
  applyBatchPrice,
  buildVariantMatrix,
  updateVariant,
} from "./variantMatrix";

describe("buildVariantMatrix", () => {
  const defaults = { baseSku: "Mug", priceStroops: "1500000", stockCount: 4 };

  it("builds the cartesian product and keeps attribute order in the sku", () => {
    const { variants, truncated } = buildVariantMatrix(
      [
        { name: "Size", values: ["S", "M"] },
        { name: "Color", values: ["Red", "Blue"] },
      ],
      defaults
    );
    expect(truncated).toBe(false);
    expect(variants).toHaveLength(4);
    expect(variants.map((variant) => variant.sku)).toEqual([
      "MUG-S-RED",
      "MUG-S-BLUE",
      "MUG-M-RED",
      "MUG-M-BLUE",
    ]);
    expect(variants[0]).toMatchObject({
      attributes: { Size: "S", Color: "Red" },
      priceStroops: "1500000",
      stockCount: 4,
    });
  });

  it("drops blank values and duplicate attribute names", () => {
    const { variants } = buildVariantMatrix(
      [
        { name: " Size ", values: ["S", " S ", ""] },
        { name: "size", values: ["L"] },
      ],
      defaults
    );
    expect(variants).toHaveLength(1);
    expect(variants[0].attributes).toEqual({ Size: "S" });
  });

  it("caps the matrix at 50 variants", () => {
    const { variants, truncated } = buildVariantMatrix(
      [
        { name: "Size", values: Array.from({ length: 10 }, (_, i) => `S${i}`) },
        { name: "Color", values: Array.from({ length: 6 }, (_, i) => `C${i}`) },
      ],
      defaults
    );
    expect(truncated).toBe(true);
    expect(variants).toHaveLength(MAX_SKU_VARIANTS);
  });

  it("keeps price and stock overrides when the matrix is rebuilt", () => {
    const first = buildVariantMatrix(
      [
        { name: "Size", values: ["S", "M"] },
        { name: "Color", values: ["Red"] },
      ],
      defaults
    ).variants;
    const overridden = updateVariant(first, "MUG-S-RED", {
      priceStroops: "999",
      stockCount: 1,
      barcode: "ABC",
    });
    const second = buildVariantMatrix(
      [
        { name: "Size", values: ["S", "M"] },
        { name: "Color", values: ["Red", "Blue"] },
      ],
      { ...defaults, priceStroops: "1", stockCount: 9 },
      overridden
    );
    const kept = second.variants.find((variant) => variant.sku === "MUG-S-RED");
    const fresh = second.variants.find((variant) => variant.attributes.Color === "Blue");
    expect(kept).toMatchObject({ priceStroops: "999", stockCount: 1, barcode: "ABC" });
    expect(fresh?.priceStroops).toBe("1");
    expect(fresh?.stockCount).toBe(9);
  });

  it("returns no variants when attributes have no values", () => {
    expect(buildVariantMatrix([{ name: "Size", values: [] }], defaults)).toEqual({
      variants: [],
      truncated: false,
    });
  });
});

describe("applyBatchPrice", () => {
  it("sets every variant price and ignores a non-stroop value", () => {
    const variants = buildVariantMatrix(
      [{ name: "Size", values: ["S", "M"] }],
      { baseSku: "Mug", priceStroops: "10", stockCount: 1 }
    ).variants;
    expect(applyBatchPrice(variants, "42").every((variant) => variant.priceStroops === "42")).toBe(
      true
    );
    expect(applyBatchPrice(variants, "1.5")).toEqual(variants);
  });
});
