/**
 * Merchant low-stock status (#913).
 *
 * Pure helpers decide when a catalog row is low or out of stock. The
 * threshold itself is a catalog setting stored in localStorage.
 */

export interface InventoryStockStatus {
  productId: string;
  sku: string;
  title: string;
  currentStock: number;
  threshold: number;
  isLowStock: boolean;
  isOutOfStock: boolean;
}

export interface StockedCatalogProduct {
  id: string;
  sku: string;
  title: string;
  stockQuantity: number;
}

export const DEFAULT_LOW_STOCK_THRESHOLD = 5;
export const LOW_STOCK_THRESHOLD_KEY = "delego.catalog.lowStockThreshold";

const THRESHOLD_EVENT = "delego:low-stock-threshold";
const MAX_THRESHOLD = 1_000_000;

/** Whole number in `[0, MAX_THRESHOLD]`. Invalid input falls back to the default. */
export function normalizeThreshold(value: unknown): number {
  if (typeof value === "string" && value.trim() === "") {
    return DEFAULT_LOW_STOCK_THRESHOLD;
  }
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return DEFAULT_LOW_STOCK_THRESHOLD;
  const whole = Math.trunc(parsed);
  if (whole < 0) return 0;
  if (whole > MAX_THRESHOLD) return MAX_THRESHOLD;
  return whole;
}

/** Non-negative whole units. Anything unusable counts as zero (out of stock). */
export function normalizeStockCount(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.trunc(parsed));
}

export function evaluateInventoryStock(input: {
  productId: string;
  sku: string;
  title: string;
  currentStock: number;
  threshold: number;
}): InventoryStockStatus {
  const currentStock = normalizeStockCount(input.currentStock);
  const threshold = normalizeThreshold(input.threshold);
  const isOutOfStock = currentStock === 0;
  const isLowStock = !isOutOfStock && threshold > 0 && currentStock <= threshold;
  return {
    productId: input.productId,
    sku: input.sku,
    title: input.title,
    currentStock,
    threshold,
    isLowStock,
    isOutOfStock,
  };
}

/** Products that should appear on the merchant warning banner. */
export function listDepletedInventory(
  products: StockedCatalogProduct[],
  threshold: number
): InventoryStockStatus[] {
  return products
    .map((product) =>
      evaluateInventoryStock({
        productId: product.id,
        sku: product.sku,
        title: product.title,
        currentStock: product.stockQuantity,
        threshold,
      })
    )
    .filter((status) => status.isLowStock || status.isOutOfStock);
}

export function readLowStockThreshold(): number {
  if (typeof window === "undefined") return DEFAULT_LOW_STOCK_THRESHOLD;
  try {
    const raw = window.localStorage.getItem(LOW_STOCK_THRESHOLD_KEY);
    if (raw === null) return DEFAULT_LOW_STOCK_THRESHOLD;
    return normalizeThreshold(raw);
  } catch {
    return DEFAULT_LOW_STOCK_THRESHOLD;
  }
}

export function writeLowStockThreshold(value: number): number {
  const threshold = normalizeThreshold(value);
  if (typeof window === "undefined") return threshold;
  try {
    window.localStorage.setItem(LOW_STOCK_THRESHOLD_KEY, String(threshold));
    window.dispatchEvent(new CustomEvent(THRESHOLD_EVENT, { detail: threshold }));
  } catch {
    // Private mode or quota — callers still keep the in-memory value.
  }
  return threshold;
}

export function subscribeLowStockThreshold(
  listener: (threshold: number) => void
): () => void {
  if (typeof window === "undefined") return () => {};
  const onCustom = (event: Event) => {
    listener(normalizeThreshold((event as CustomEvent<number>).detail));
  };
  const onStorage = (event: StorageEvent) => {
    if (event.key !== LOW_STOCK_THRESHOLD_KEY) return;
    listener(readLowStockThreshold());
  };
  window.addEventListener(THRESHOLD_EVENT, onCustom);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(THRESHOLD_EVENT, onCustom);
    window.removeEventListener("storage", onStorage);
  };
}
