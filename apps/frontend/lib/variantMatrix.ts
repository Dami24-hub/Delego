/**
 * SKU variant matrix (#914). Cartesian combinations of merchant attributes,
 * capped at 50, with price and stock overrides preserved across rebuilds.
 */

export interface ProductAttribute {
  name: string;
  values: string[];
}

export interface ProductVariant {
  sku: string;
  attributes: Record<string, string>;
  priceStroops: string;
  stockCount: number;
  barcode?: string;
}

export interface CatalogVariantRecord {
  productKey: string;
  attributes: ProductAttribute[];
  variants: ProductVariant[];
}

export const MAX_SKU_VARIANTS = 50;
const STORE_KEY = "delego.catalog.variantMatrix";

export function catalogProductKey(title: string): string {
  return title.trim().toLowerCase();
}

function uniqueValues(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const trimmed = value.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    result.push(trimmed);
  }
  return result;
}

export function cleanAttributes(attributes: ProductAttribute[]): ProductAttribute[] {
  const seenNames = new Set<string>();
  const cleaned: ProductAttribute[] = [];
  for (const attribute of attributes) {
    const name = attribute.name.trim();
    const key = name.toLowerCase();
    if (!name || seenNames.has(key)) continue;
    const values = uniqueValues(attribute.values);
    if (values.length === 0) continue;
    seenNames.add(key);
    cleaned.push({ name, values });
  }
  return cleaned;
}

function skuPart(value: string): string {
  const cleaned = value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return cleaned || "X";
}

export function variantAttributeKey(attributes: Record<string, string>): string {
  return Object.keys(attributes)
    .sort()
    .map((name) => `${name}=${attributes[name]}`)
    .join("|");
}

function buildSku(
  baseSku: string,
  attributes: Record<string, string>,
  order: ProductAttribute[]
): string {
  return [skuPart(baseSku || "SKU"), ...order.map((attr) => skuPart(attributes[attr.name] ?? ""))].join(
    "-"
  );
}

function dedupeSkus(variants: ProductVariant[]): ProductVariant[] {
  const used = new Set<string>();
  return variants.map((variant) => {
    let sku = variant.sku || "SKU";
    if (!used.has(sku)) {
      used.add(sku);
      return variant;
    }
    let n = 2;
    while (used.has(`${sku}-${n}`)) n += 1;
    const next = `${sku}-${n}`;
    used.add(next);
    return { ...variant, sku: next };
  });
}

export function buildVariantMatrix(
  attributes: ProductAttribute[],
  defaults: { baseSku: string; priceStroops: string; stockCount: number },
  previous: ProductVariant[] = []
): { variants: ProductVariant[]; truncated: boolean } {
  const cleaned = cleanAttributes(attributes);
  if (cleaned.length === 0) return { variants: [], truncated: false };

  const price = /^\d+$/.test(defaults.priceStroops) ? defaults.priceStroops : "0";
  const stock =
    Number.isInteger(defaults.stockCount) && defaults.stockCount > 0
      ? defaults.stockCount
      : Math.max(0, Math.trunc(defaults.stockCount) || 0);

  let truncated = false;
  let combos: Record<string, string>[] = [];
  for (const attribute of cleaned) {
    if (combos.length === 0) {
      combos = attribute.values.map((value) => ({ [attribute.name]: value }));
    } else {
      const next: Record<string, string>[] = [];
      for (const partial of combos) {
        for (const value of attribute.values) {
          next.push({ ...partial, [attribute.name]: value });
          if (next.length > MAX_SKU_VARIANTS) {
            truncated = true;
            break;
          }
        }
        if (truncated) break;
      }
      combos = next;
    }
    if (combos.length > MAX_SKU_VARIANTS) {
      truncated = true;
      combos = combos.slice(0, MAX_SKU_VARIANTS);
      break;
    }
  }

  const previousByKey = new Map(
    previous.map((variant) => [variantAttributeKey(variant.attributes), variant])
  );

  const variants = dedupeSkus(
    combos.map((combo) => {
      const prior = previousByKey.get(variantAttributeKey(combo));
      return {
        sku: prior?.sku || buildSku(defaults.baseSku, combo, cleaned),
        attributes: combo,
        priceStroops: prior?.priceStroops ?? price,
        stockCount: prior?.stockCount ?? stock,
        ...(prior?.barcode ? { barcode: prior.barcode } : {}),
      };
    })
  );

  return { variants, truncated };
}

export function applyBatchPrice(variants: ProductVariant[], priceStroops: string): ProductVariant[] {
  if (!/^\d+$/.test(priceStroops)) return variants;
  return variants.map((variant) => ({ ...variant, priceStroops }));
}

export function updateVariant(
  variants: ProductVariant[],
  sku: string,
  patch: Partial<Pick<ProductVariant, "priceStroops" | "stockCount" | "barcode">>
): ProductVariant[] {
  return variants.map((variant) => (variant.sku === sku ? { ...variant, ...patch } : variant));
}

function readStore(): Record<string, CatalogVariantRecord> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return parsed as Record<string, CatalogVariantRecord>;
  } catch {
    return {};
  }
}

export function loadCatalogVariants(productKey: string): CatalogVariantRecord | null {
  if (!productKey) return null;
  const record = readStore()[productKey];
  if (!record || !Array.isArray(record.variants) || !Array.isArray(record.attributes)) return null;
  return record;
}

export function saveCatalogVariants(record: CatalogVariantRecord): void {
  if (typeof window === "undefined" || !record.productKey) return;
  try {
    const store = readStore();
    store[record.productKey] = record;
    window.localStorage.setItem(STORE_KEY, JSON.stringify(store));
  } catch {
    // Persistence is best-effort; the submit payload still carries the variants.
  }
}

export function removeCatalogVariants(productKey: string): void {
  if (typeof window === "undefined" || !productKey) return;
  try {
    const store = readStore();
    delete store[productKey];
    window.localStorage.setItem(STORE_KEY, JSON.stringify(store));
  } catch {
    // Ignore storage failures.
  }
}
