/**
 * Picks the highest-quality primary language subtag from an Accept-Language
 * header, e.g. "en-US;q=0.5, de;q=0.9" -> "de" (not "en", despite being
 * first in the list — its q-value is lower). Returns undefined for an empty
 * or missing header.
 */
export function parseAcceptLanguage(header: string | null | undefined): string | undefined {
  if (!header) return undefined;

  const ranked = header
    .split(",")
    .map((entry) => {
      const [tag, ...params] = entry.trim().split(";");
      const qParam = params.find((p) => p.trim().startsWith("q="));
      const quality = qParam ? parseFloat(qParam.split("=")[1]) : 1;
      return { tag: tag.trim().split("-")[0], quality: Number.isNaN(quality) ? 1 : quality };
    })
    .sort((a, b) => b.quality - a.quality);

  return ranked[0]?.tag;
}
