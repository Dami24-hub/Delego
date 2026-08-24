#!/usr/bin/env node
/**
 * Missing-key lint warning for i18n message files (#556 FE-049).
 *
 * Flattens each messages/<locale>.json against the `en` baseline and warns
 * (does not fail the build — partial locale files fall back to the English
 * string via i18n/request.ts's deepMerge) about keys present in `en` but
 * missing elsewhere. Run via `pnpm --filter @delegolabs/web check:i18n`.
 */
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const messagesDir = path.resolve(__dirname, "../messages");
const baselineLocale = "en";

function flatten(obj, prefix = "") {
  const keys = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      keys.push(...flatten(value, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

function loadLocale(locale) {
  const raw = readFileSync(path.join(messagesDir, `${locale}.json`), "utf8");
  return JSON.parse(raw);
}

const baseline = loadLocale(baselineLocale);
const baselineKeys = new Set(flatten(baseline));

const locales = readdirSync(messagesDir)
  .filter((f) => f.endsWith(".json"))
  .map((f) => f.replace(/\.json$/, ""))
  .filter((locale) => locale !== baselineLocale);

let hadWarnings = false;

for (const locale of locales) {
  const messages = loadLocale(locale);
  const keys = new Set(flatten(messages));
  const missing = [...baselineKeys].filter((k) => !keys.has(k));
  const extra = [...keys].filter((k) => !baselineKeys.has(k));

  if (missing.length > 0) {
    hadWarnings = true;
    console.warn(
      `::warning::[i18n] ${locale}.json is missing ${missing.length} key(s) present in en.json (falls back to the English string):\n  ${missing.join("\n  ")}`
    );
  }
  if (extra.length > 0) {
    hadWarnings = true;
    console.warn(
      `::warning::[i18n] ${locale}.json has ${extra.length} key(s) not present in en.json (dead keys?):\n  ${extra.join("\n  ")}`
    );
  }
}

if (!hadWarnings) {
  console.log("[i18n] All locale files match the en.json key set.");
}

// Warning-only: missing keys fall back cleanly (see i18n/request.ts deepMerge),
// so this never fails the build — it just surfaces the extraction gap in CI logs.
process.exit(0);
