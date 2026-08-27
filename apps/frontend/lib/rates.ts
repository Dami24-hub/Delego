/**
 * XLM exchange rate source for the fiat/USDC-equivalent display modes
 * (FE-039). Env-configurable so a real rates backend can be swapped in
 * without a code change; falls back to a static placeholder rate when unset
 * or unreachable so the estimate modes stay usable (with a staleness
 * indicator) rather than erroring.
 */

const RATE_CACHE_KEY = "delego_xlm_rate_cache";
const RATE_STALE_AFTER_MS = 5 * 60 * 1000;

/** Placeholder rate used when no live source is configured/reachable. Not live market data. */
const FALLBACK_XLM_USD_RATE = 0.12;

export interface RateSnapshot {
  /** USD value of 1 XLM */
  xlmUsdRate: number;
  /** Epoch millis the rate was fetched (or when the fallback was applied) */
  fetchedAt: number;
  /** True when this is the static fallback, not a live-fetched rate */
  isFallback: boolean;
}

function readCache(): RateSnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(RATE_CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as RateSnapshot;
  } catch {
    return null;
  }
}

function writeCache(snapshot: RateSnapshot) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(RATE_CACHE_KEY, JSON.stringify(snapshot));
  } catch {
    // Ignore persistence failures — the in-memory value still updates.
  }
}

function fallbackSnapshot(): RateSnapshot {
  return {
    xlmUsdRate: FALLBACK_XLM_USD_RATE,
    fetchedAt: Date.now(),
    isFallback: true,
  };
}

/** True once a rate is older than the staleness window — surface a staleness indicator in the UI. */
export function isRateStale(snapshot: RateSnapshot): boolean {
  return (
    snapshot.isFallback || Date.now() - snapshot.fetchedAt > RATE_STALE_AFTER_MS
  );
}

/**
 * Fetches the current XLM/USD rate from `NEXT_PUBLIC_XLM_RATE_URL` (expected
 * to return `{ xlmUsdRate: number }`). Falls back to the last cached value,
 * then to the static placeholder, if the endpoint is unset or the request
 * fails — callers should pair this with `isRateStale` to warn the user.
 */
export async function fetchXlmRate(
  signal?: AbortSignal
): Promise<RateSnapshot> {
  const url = process.env.NEXT_PUBLIC_XLM_RATE_URL;
  if (!url) {
    return readCache() ?? fallbackSnapshot();
  }

  try {
    const res = await fetch(url, { signal });
    if (!res.ok) throw new Error(`Rate endpoint returned ${res.status}`);
    const body = (await res.json()) as { xlmUsdRate: number };
    if (
      typeof body.xlmUsdRate !== "number" ||
      !Number.isFinite(body.xlmUsdRate)
    ) {
      throw new Error("Rate endpoint returned an invalid rate");
    }
    const snapshot: RateSnapshot = {
      xlmUsdRate: body.xlmUsdRate,
      fetchedAt: Date.now(),
      isFallback: false,
    };
    writeCache(snapshot);
    return snapshot;
  } catch {
    return readCache() ?? fallbackSnapshot();
  }
}
