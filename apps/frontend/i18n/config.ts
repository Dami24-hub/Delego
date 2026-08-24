/**
 * Supported locales for the Delego web app (#556 FE-049).
 *
 * No URL-prefix routing yet — the active locale is negotiated from a cookie
 * (falling back to the `Accept-Language` header) in `i18n/request.ts`. Add a
 * locale here and drop a matching `messages/<locale>.json` file to support
 * a new language; missing keys fall back to the `en` baseline.
 */
export const locales = ["en", "de"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export const LOCALE_COOKIE = "delego_locale";

export function isLocale(value: string | undefined | null): value is Locale {
  return !!value && (locales as readonly string[]).includes(value);
}
