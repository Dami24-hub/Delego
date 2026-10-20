import { describe, expect, it } from "vitest";
import {
  availableToSell,
  canAddToCart,
  describeStockTransition,
  parseStockDepletion,
  resolveStockPhase,
  stockBadgeText,
  validateRestockContact,
  type StockDepletionInfo,
} from "./stockDepletion";

function info(overrides: Partial<StockDepletionInfo> = {}): StockDepletionInfo {
  return {
    productId: "p1",
    remainingStock: 10,
    reservedStock: 0,
    allowBackorder: false,
    restockWaitlistCount: 0,
    ...overrides,
  };
}

describe("stock status transitions", () => {
  it("treats reserved units as unavailable", () => {
    expect(availableToSell(info({ remainingStock: 5, reservedStock: 2 }))).toBe(3);
    expect(availableToSell(info({ remainingStock: 1, reservedStock: 4 }))).toBe(0);
  });

  it("moves from in stock to low, then to backorder or out of stock", () => {
    const healthy = info({ remainingStock: 8 });
    const low = info({ remainingStock: 3 });
    const backorder = info({ remainingStock: 0, allowBackorder: true });
    const gone = info({ remainingStock: 0 });

    expect(resolveStockPhase(healthy)).toBe("in_stock");
    expect(stockBadgeText(low)).toBe("Only 3 left!");
    expect(describeStockTransition(healthy, low)).toEqual({
      from: "in_stock",
      to: "low",
      changed: true,
    });
    expect(resolveStockPhase(backorder)).toBe("backorder");
    expect(stockBadgeText(backorder)).toBe("Backorder Available");
    expect(resolveStockPhase(gone)).toBe("out_of_stock");
    expect(describeStockTransition(low, gone).changed).toBe(true);
  });

  it("blocks cart addition only when nothing is left and backorder is off", () => {
    expect(canAddToCart(info({ remainingStock: 0, reservedStock: 0 }))).toBe(false);
    expect(canAddToCart(info({ remainingStock: 2, reservedStock: 2 }))).toBe(false);
    expect(canAddToCart(info({ remainingStock: 0, allowBackorder: true }))).toBe(true);
    expect(canAddToCart(info({ remainingStock: 1 }))).toBe(true);
  });

  it("parses an inventory payload and ignores products without a stock count", () => {
    expect(
      parseStockDepletion(
        { remainingStock: 4, reservedStock: 1, allowBackorder: false, restockWaitlistCount: 2 },
        "p1"
      )
    ).toMatchObject({ remainingStock: 4, reservedStock: 1, restockWaitlistCount: 2 });
    expect(parseStockDepletion({ name: "Mug" }, "p1")).toBeNull();
  });
});

describe("validateRestockContact", () => {
  it("requires an email or a stellar public key", () => {
    expect(validateRestockContact({})).toMatch(/email or a Stellar/);
    expect(validateRestockContact({ email: "not-an-email" })).toMatch(/valid email/);
    expect(validateRestockContact({ publicKey: "GABC" })).toMatch(/public key/);
    expect(validateRestockContact({ email: "buyer@example.com" })).toBeNull();
  });
});
