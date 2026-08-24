import { getRequestConfig } from "next-intl/server";
import { cookies, headers } from "next/headers";
import { defaultLocale, isLocale, LOCALE_COOKIE, type Locale } from "./config";

/**
 * Resolves the active locale for a request: cookie first (set by the
 * settings language switcher), then the browser's `Accept-Language` header,
 * falling back to `defaultLocale`. No URL-prefix routing (see i18n/config.ts).
 */
async function resolveLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value;
  if (isLocale(cookieLocale)) return cookieLocale;

  const headerStore = await headers();
  const acceptLanguage = headerStore.get("accept-language");
  const preferred = acceptLanguage?.split(",")[0]?.trim().split("-")[0];
  if (isLocale(preferred)) return preferred;

  return defaultLocale;
}

export default getRequestConfig(async () => {
  const locale = await resolveLocale();

  // Merge onto the `en` baseline so a partial translation (e.g. a de.json
  // missing newer keys) still renders every string instead of leaving gaps.
  const baseline = (await import(`../messages/${defaultLocale}.json`)).default;
  const messages =
    locale === defaultLocale
      ? baseline
      : deepMerge(baseline, (await import(`../messages/${locale}.json`)).default);

  return { locale, messages };
});

function deepMerge(
  base: Record<string, unknown>,
  overrides: Record<string, unknown>
): Record<string, unknown> {
  const result: Record<string, unknown> = { ...base };
  for (const key of Object.keys(overrides)) {
    const overrideValue = overrides[key];
    const baseValue = base[key];
    if (
      overrideValue &&
      typeof overrideValue === "object" &&
      !Array.isArray(overrideValue) &&
      baseValue &&
      typeof baseValue === "object" &&
      !Array.isArray(baseValue)
    ) {
      result[key] = deepMerge(
        baseValue as Record<string, unknown>,
        overrideValue as Record<string, unknown>
      );
    } else {
      result[key] = overrideValue;
    }
  }
  return result;
}
