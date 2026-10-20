import { describe, expect, it } from "vitest";
import {
  DEFAULT_LOW_STOCK_THRESHOLD,
  evaluateInventoryStock,
  listDepletedInventory,
  normalizeThreshold,
} from "./inventoryStock";

const product = {
  productId: "p1",
  sku: "MUG-1",
  title: "Blue mug",
};

describe("evaluateInventoryStock", () => {
  it("flags zero stock as out of stock and not low stock", () => {
    const status = evaluateInventoryStock({
      ...product,
      currentStock: 0,
      threshold: 5,
    });
    expect(status.isOutOfStock).toBe(true);
    expect(status.isLowStock).toBe(false);
    expect(status.currentStock).toBe(0);
  });

  it("flags positive stock at or under the threshold as low stock", () => {
    expect(
      evaluateInventoryStock({ ...product, currentStock: 3, threshold: 5 })
        .isLowStock
    ).toBe(true);
    const atThreshold = evaluateInventoryStock({
      ...product,
      currentStock: 5,
      threshold: 5,
    });
    expect(atThreshold.isLowStock).toBe(true);
    expect(atThreshold.isOutOfStock).toBe(false);
  });

  it("leaves healthy stock unmarked", () => {
    const status = evaluateInventoryStock({
      ...product,
      currentStock: 6,
      threshold: 5,
    });
    expect(status.isLowStock).toBe(false);
    expect(status.isOutOfStock).toBe(false);
  });

  it("treats a zero threshold as disabled low-stock warnings", () => {
    const status = evaluateInventoryStock({
      ...product,
      currentStock: 1,
      threshold: 0,
    });
    expect(status.isLowStock).toBe(false);
    expect(status.isOutOfStock).toBe(false);
  });

  it("clamps negative and fractional counts to whole units", () => {
    expect(
      evaluateInventoryStock({ ...product, currentStock: -4, threshold: 5 })
        .isOutOfStock
    ).toBe(true);
    expect(
      evaluateInventoryStock({ ...product, currentStock: 2.9, threshold: 5 })
        .currentStock
    ).toBe(2);
  });

  it("falls back when the threshold is not a number", () => {
    expect(normalizeThreshold("nope")).toBe(DEFAULT_LOW_STOCK_THRESHOLD);
    expect(normalizeThreshold("")).toBe(DEFAULT_LOW_STOCK_THRESHOLD);
    expect(normalizeThreshold(-3)).toBe(0);
  });
});

describe("listDepletedInventory", () => {
  it("returns only low and out-of-stock rows, in catalog order", () => {
    const depleted = listDepletedInventory(
      [
        { id: "a", sku: "A", title: "Healthy", stockQuantity: 20 },
        { id: "b", sku: "B", title: "Low", stockQuantity: 2 },
        { id: "c", sku: "C", title: "Empty", stockQuantity: 0 },
      ],
      5
    );
    expect(depleted.map((row) => row.productId)).toEqual(["b", "c"]);
    expect(depleted[0].isLowStock).toBe(true);
    expect(depleted[1].isOutOfStock).toBe(true);
  });
});
