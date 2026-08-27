"use client";

import { useTranslations, useLocale } from "next-intl";
import { Card } from "@delegolabs/ui";
import { locales, LOCALE_COOKIE, type Locale } from "../../i18n/config";

const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  de: "Deutsch",
};

/**
 * Language switcher stub (#556 FE-049).
 *
 * Sets the locale cookie next-intl's request config reads and reloads so the
 * server re-renders with the new locale. No URL-prefix routing.
 */
export function LanguageSwitcher() {
  const t = useTranslations("settings.language");
  const locale = useLocale();

  function handleChange(next: Locale) {
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; SameSite=Lax`;
    window.location.reload();
  }

  return (
    <Card title={t("label")} ariaLabel={t("label")}>
      <div className="settings-section">
        <label
          htmlFor="language-select"
          style={{ display: "block", fontWeight: 500, marginBottom: "0.5rem" }}
        >
          {t("label")}
        </label>
        <p
          style={{ fontSize: "0.875rem", color: "#666", margin: "0 0 0.5rem" }}
        >
          {t("hint")}
        </p>
        <select
          id="language-select"
          value={locale}
          onChange={(e) => handleChange(e.target.value as Locale)}
          style={{ width: "100%", padding: "0.5rem", borderRadius: "0.375rem" }}
        >
          {locales.map((code) => (
            <option key={code} value={code}>
              {LOCALE_LABELS[code]}
            </option>
          ))}
        </select>
      </div>
    </Card>
  );
}
