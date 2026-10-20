/**
 * Buyer-facing stock depletion (#916). Available units are remaining minus
 * reserved. Zero stock blocks the cart unless backorder is allowed.
 */

export interface StockDepletionInfo {
  productId: string;
  remainingStock: number;
  reservedStock: number;
  allowBackorder: boolean;
  restockWaitlistCount: number;
}

export type StockPhase = "in_stock" | "low" | "backorder" | "out_of_stock";

export const LOW_STOCK_DISPLAY_AT = 5;
const WAITLIST_KEY = "delego.restock.waitlist";
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const STELLAR_KEY = /^G[A-Z2-7]{55}$/;

function whole(value: unknown): number {
  if (typeof value === "string" && !/^\d+$/.test(value.trim())) return 0;
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.trunc(parsed));
}

export function availableToSell(
  info: Pick<StockDepletionInfo, "remainingStock" | "reservedStock">
): number {
  return Math.max(0, whole(info.remainingStock) - whole(info.reservedStock));
}

export function resolveStockPhase(info: StockDepletionInfo): StockPhase {
  const available = availableToSell(info);
  if (available > LOW_STOCK_DISPLAY_AT) return "in_stock";
  if (available > 0) return "low";
  if (info.allowBackorder) return "backorder";
  return "out_of_stock";
}

export function canAddToCart(info: StockDepletionInfo): boolean {
  return availableToSell(info) > 0 || info.allowBackorder === true;
}

export function stockBadgeText(info: StockDepletionInfo): string | null {
  const phase = resolveStockPhase(info);
  if (phase === "low") return `Only ${availableToSell(info)} left!`;
  if (phase === "backorder") return "Backorder Available";
  if (phase === "out_of_stock") return "Out of Stock";
  return null;
}

export function describeStockTransition(previous: StockDepletionInfo, next: StockDepletionInfo) {
  const from = resolveStockPhase(previous);
  const to = resolveStockPhase(next);
  return { from, to, changed: from !== to };
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

export function parseStockDepletion(value: unknown, productId: string): StockDepletionInfo | null {
  const root = asRecord(value);
  const record = asRecord(root?.data) ?? asRecord(root?.stock) ?? root;
  if (!record) return null;
  const remaining = record.remainingStock ?? record.remaining_stock ?? record.stockQuantity;
  if (typeof remaining === "number") {
    if (!Number.isFinite(remaining)) return null;
  } else if (typeof remaining !== "string" || !/^\d+$/.test(remaining.trim())) {
    return null;
  }
  return {
    productId: typeof record.productId === "string" ? record.productId : productId,
    remainingStock: whole(remaining),
    reservedStock: whole(record.reservedStock ?? record.reserved_stock ?? 0),
    allowBackorder: record.allowBackorder === true || record.allow_backorder === true,
    restockWaitlistCount: whole(record.restockWaitlistCount ?? record.restock_waitlist_count ?? 0),
  };
}

export function inventoryPollUrl(apiBase: string, merchantId: string, productId: string): string {
  const base = apiBase.replace(/\/$/, "");
  return `${base}/merchants/${encodeURIComponent(merchantId)}/products/${encodeURIComponent(productId)}/inventory`;
}

export async function fetchStockDepletion(
  merchantId: string,
  productId: string
): Promise<StockDepletionInfo | null> {
  const base = process.env.NEXT_PUBLIC_API_URL;
  if (!base || !merchantId || !productId) return null;
  try {
    const res = await fetch(inventoryPollUrl(base, merchantId, productId), { cache: "no-store" });
    if (!res.ok) return null;
    return parseStockDepletion(await res.json(), productId);
  } catch {
    return null;
  }
}

export function validateRestockContact(contact: { email?: string; publicKey?: string }): string | null {
  const email = contact.email?.trim() ?? "";
  const publicKey = contact.publicKey?.trim() ?? "";
  if (!email && !publicKey) return "Enter an email or a Stellar public key.";
  if (email && !EMAIL.test(email)) return "Enter a valid email address.";
  if (publicKey && !STELLAR_KEY.test(publicKey)) return "Enter a valid Stellar public key.";
  return null;
}

export function saveRestockRequest(request: {
  merchantId: string;
  productId: string;
  email?: string;
  publicKey?: string;
}): void {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(WAITLIST_KEY);
    const list = raw ? (JSON.parse(raw) as unknown[]) : [];
    const next = Array.isArray(list) ? list : [];
    next.push({ ...request, requestedAt: new Date().toISOString() });
    window.localStorage.setItem(WAITLIST_KEY, JSON.stringify(next));
  } catch {
    // The caller still surfaces a confirmation when validation passed.
  }
}

export async function submitRestockRequest(request: {
  merchantId: string;
  productId: string;
  email?: string;
  publicKey?: string;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const message = validateRestockContact(request);
  if (message) return { ok: false, message };
  saveRestockRequest(request);
  const base = process.env.NEXT_PUBLIC_API_URL;
  if (!base) return { ok: true };
  try {
    await fetch(
      `${base.replace(/\/$/, "")}/merchants/${encodeURIComponent(request.merchantId)}/products/${encodeURIComponent(request.productId)}/restock-notify`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      }
    );
  } catch {
    // The request is already stored locally.
  }
  return { ok: true };
}
