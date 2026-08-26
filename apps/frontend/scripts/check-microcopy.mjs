#!/usr/bin/env node
/**
 * Microcopy consistency lint warning (#640).
 *
 * Scans user-visible string literals in components/app code and the i18n
 * message catalog for a small set of banned phrases and label drift, per
 * docs/frontend-voice.md. Warns (does not fail the build) — this is a
 * lightweight net for the most common regressions, not a full style
 * checker. Run via `pnpm --filter @delegolabs/web check:microcopy`.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.resolve(__dirname, "..");

const SCAN_DIRS = ["components", "app"].map((d) =>
  path.join(frontendRoot, d)
);
const MESSAGES_FILE = path.join(frontendRoot, "messages", "en.json");
const SOURCE_EXTENSIONS = new Set([".ts", ".tsx"]);
const SKIP_SUFFIXES = [".test.ts", ".test.tsx", ".spec.ts", ".spec.tsx"];

// A user-visible string literal: a quoted string containing at least one
// letter, long enough to plausibly be copy rather than a class name, CSS
// value, or identifier. This is deliberately conservative — false
// negatives (missing a real string) are fine for a warning-level lint;
// false positives (flagging `className="..."`) would just be noise.
const STRING_LITERAL = /(["'`])((?:(?!\1)[^\\]|\\.)*[A-Za-z][^\\]*?)\1/g;

const BANNED_PHRASES = [/\boops\b/i, /\bsorry\b/i];
const EXCLAMATION_SPAM = /[A-Za-z][^"'`]*!\s*$/;
const BARE_RETRY = /^retry$/i;

function* walk(dir) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      if (entry === "node_modules" || entry === ".next") continue;
      yield* walk(full);
    } else if (
      SOURCE_EXTENSIONS.has(path.extname(entry)) &&
      !SKIP_SUFFIXES.some((suffix) => entry.endsWith(suffix))
    ) {
      yield full;
    }
  }
}

function relative(filePath) {
  return path.relative(path.resolve(frontendRoot, ".."), filePath);
}

const findings = [];

function checkString(filePath, value) {
  const trimmed = value.trim();
  if (trimmed.length < 3) return;

  for (const pattern of BANNED_PHRASES) {
    if (pattern.test(trimmed)) {
      findings.push({
        file: relative(filePath),
        rule: "banned-phrase",
        value: trimmed,
      });
    }
  }

  if (EXCLAMATION_SPAM.test(trimmed)) {
    findings.push({
      file: relative(filePath),
      rule: "exclamation-spam",
      value: trimmed,
    });
  }

  if (BARE_RETRY.test(trimmed)) {
    findings.push({
      file: relative(filePath),
      rule: "bare-retry-label",
      value: trimmed,
    });
  }
}

for (const dir of SCAN_DIRS) {
  for (const filePath of walk(dir)) {
    const contents = readFileSync(filePath, "utf8");
    for (const match of contents.matchAll(STRING_LITERAL)) {
      checkString(filePath, match[2]);
    }
  }
}

// The message catalog is JSON, not JS string literals — walk its values
// directly rather than reusing the regex above.
function walkMessageValues(obj, filePath) {
  for (const value of Object.values(obj)) {
    if (typeof value === "string") {
      checkString(filePath, value);
    } else if (value && typeof value === "object") {
      walkMessageValues(value, filePath);
    }
  }
}

try {
  const messages = JSON.parse(readFileSync(MESSAGES_FILE, "utf8"));
  walkMessageValues(messages, MESSAGES_FILE);
} catch {
  // messages/en.json is required elsewhere (check:i18n); nothing to add here.
}

if (findings.length > 0) {
  for (const finding of findings) {
    console.warn(
      `::warning::[microcopy] ${finding.file}: ${finding.rule} — "${finding.value}"`
    );
  }
  console.warn(
    `[microcopy] ${findings.length} finding(s). See docs/frontend-voice.md.`
  );
} else {
  console.log("[microcopy] No banned phrases, exclamation spam, or bare \"Retry\" labels found.");
}

// Warning-only, per the issue's acceptance criteria — this is a lint aid,
// not a hard gate.
process.exit(0);
