#!/usr/bin/env node
/**
 * Bans coverage-ignore directives in packages/ui/src (#629).
 *
 * @vitest/coverage-v8 has no config flag to reject `/* v8 ignore *\/`,
 * `/* c8 ignore *\/`, or `/* istanbul ignore *\/` comments — they're an
 * escape hatch built into the tool. The design-system package's coverage
 * gate is meant to be closed by writing tests for real gaps, not by
 * suppressing them, so this script greps for those directives and fails
 * the build if any are found. Run via `pnpm --filter @delegolabs/ui
 * check:no-coverage-ignores`.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.resolve(__dirname, "../src");

const IGNORE_DIRECTIVE = /\/\*\s*(v8|c8|istanbul)\s+ignore\b/i;

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      yield* walk(full);
    } else if (/\.(ts|tsx)$/.test(entry)) {
      yield full;
    }
  }
}

const offenders = [];

for (const filePath of walk(srcDir)) {
  const lines = readFileSync(filePath, "utf8").split("\n");
  lines.forEach((line, index) => {
    if (IGNORE_DIRECTIVE.test(line)) {
      offenders.push({
        file: path.relative(path.resolve(srcDir, "../.."), filePath),
        line: index + 1,
        text: line.trim(),
      });
    }
  });
}

if (offenders.length > 0) {
  console.error(
    "Coverage-ignore directives are not allowed in packages/ui/src — write a test for the gap instead:\n"
  );
  for (const offender of offenders) {
    console.error(`  ${offender.file}:${offender.line}  ${offender.text}`);
  }
  process.exit(1);
}

console.log("[coverage] No coverage-ignore directives found in packages/ui/src.");
process.exit(0);
