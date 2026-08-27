/**
 * Cache Storage is shared between the service worker and page JS, so the
 * offline page can list what's available without any messaging round trip —
 * it just opens the same named cache. Keep this name in sync with
 * API_READS_CACHE in public/sw.js.
 */
export const API_READS_CACHE_NAME = "delego-api-reads-v1";

const CACHED_AT_HEADER = "x-delego-cached-at";

export interface CachedRead {
  url: string;
  /** Best-effort human label derived from the URL path. */
  label: string;
  cachedAt: Date | null;
}

/** Turns "/orders?status=pending" into "Orders", "/delegations/abc123" into "Delegations", etc. */
function labelFromPath(pathname: string): string {
  const segment = pathname.split("/").filter(Boolean)[0];
  if (!segment) return "Home";
  return segment.charAt(0).toUpperCase() + segment.slice(1);
}

/**
 * Lists the API GET responses the service worker has cached for offline
 * reading. Returns an empty list (never throws) when Cache Storage is
 * unavailable, e.g. in browsers without service worker support.
 */
export async function listCachedReads(): Promise<CachedRead[]> {
  if (typeof caches === "undefined") return [];

  try {
    const cache = await caches.open(API_READS_CACHE_NAME);
    const requests = await cache.keys();
    const reads = await Promise.all(
      requests.map(async (request) => {
        const response = await cache.match(request);
        const cachedAtHeader = response?.headers.get(CACHED_AT_HEADER);
        const url = new URL(request.url);
        return {
          url: request.url,
          label: labelFromPath(url.pathname),
          cachedAt: cachedAtHeader ? new Date(Number(cachedAtHeader)) : null,
        };
      })
    );
    return reads.sort(
      (a, b) => (b.cachedAt?.getTime() ?? 0) - (a.cachedAt?.getTime() ?? 0)
    );
  } catch {
    return [];
  }
}
