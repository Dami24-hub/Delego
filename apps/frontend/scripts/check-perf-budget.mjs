#!/usr/bin/env node
/**
 * Fails if any route's First Load JS exceeds the budget documented in
 * docs/architecture/frontend-perf.md (#512). Runs `next build` (which
 * `pnpm analyze` also triggers) and parses the route size table Next.js
 * prints to stdout — the same numbers `next build` always reports, so no
 * extra instrumentation is needed.
 */
import { spawnSync } from "node:child_process";

const BUDGET_KB = 200;

// Matches a route row like:
//   ├ ○ /orders                             4.1 kB         187 kB
// capturing the route path and the "First Load JS" column (last size on the line).
const ROUTE_ROW = /^[│├└─┌\s]*[○●λƒ]\s+(\/\S*)\s+[\d.]+\s*[kKmM]?B\s+([\d.]+)\s*([kKmM])B\s*$/;

function parseSizeKb(value, unit) {
  const n = Number(value);
  if (unit.toLowerCase() === "m") return n * 1024;
  return n;
}

const result = spawnSync("pnpm", ["build"], {
  cwd: new URL("..", import.meta.url).pathname,
  encoding: "utf8",
  env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" },
});

const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
process.stdout.write(output);

if (result.status !== 0) {
  console.error("\nBuild failed — cannot check the performance budget.");
  process.exit(result.status ?? 1);
}

const overBudget = [];
for (const line of output.split("\n")) {
  const match = ROUTE_ROW.exec(line);
  if (!match) continue;
  const [, route, sizeValue, sizeUnit] = match;
  const kb = parseSizeKb(sizeValue, sizeUnit);
  if (kb > BUDGET_KB) {
    overBudget.push({ route, kb });
  }
}

if (overBudget.length === 0) {
  console.log(`\n✓ All routes are within the ${BUDGET_KB}KB First Load JS budget.`);
  process.exit(0);
}

console.error(`\n✗ ${overBudget.length} route(s) exceed the ${BUDGET_KB}KB First Load JS budget:`);
for (const { route, kb } of overBudget) {
  console.error(`  ${route}: ${kb}KB`);
}
console.error("\nSee docs/architecture/frontend-perf.md for the budget and how to reduce bundle size.");
process.exit(1);
