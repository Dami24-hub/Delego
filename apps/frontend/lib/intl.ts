/**
 * Shared Intl.DateTimeFormat / Intl.NumberFormat helpers (#556 FE-049).
 *
 * Centralizes locale-aware formatting so date/number display follows the
 * user's selected app language (see components/settings/LanguageSwitcher)
 * rather than only the browser's default locale. Pass the active locale from
 * `useLocale()` in client components; server components can use `getLocale()`.
 */

export function formatDate(
  date: Date,
  locale: string,
  options: Intl.DateTimeFormatOptions = { dateStyle: "medium" }
): string {
  return new Intl.DateTimeFormat(locale, options).format(date);
}

export function formatDateTime(
  date: Date,
  locale: string,
  options: Intl.DateTimeFormatOptions = {
    dateStyle: "medium",
    timeStyle: "short",
  }
): string {
  return new Intl.DateTimeFormat(locale, options).format(date);
}

export function formatNumber(
  value: number,
  locale: string,
  options?: Intl.NumberFormatOptions
): string {
  return new Intl.NumberFormat(locale, options).format(value);
}
