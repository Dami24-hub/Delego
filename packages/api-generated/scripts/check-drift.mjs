#!/usr/bin/env node
/**
 * CI drift check for @delegolabs/api-generated (#633).
 *
 * Fails with a non-zero exit code and readable instructions when the OpenAPI
 * spec hash does not match the hash embedded in the generated client, i.e.
 * when someone changed `openapi.yaml` without re-running `pnpm generate`.
 *
 * Usage (CI):
 *   pnpm --filter @delegolabs/api-generated check:drift
 *
 * If this check goes red on your PR, run:
 *   pnpm --filter @delegolabs/api-generated generate
 * and commit the regenerated src/index.ts and src/.spec-hash.
 */

import { createHash } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const specPath = join(ROOT, "openapi.yaml");
const hashFilePath = join(ROOT, "src", ".spec-hash");

// Compute current spec hash
const specContent = readFileSync(specPath, "utf8");
const currentHash = createHash("sha256").update(specContent).digest("hex").slice(0, 16);

// Read the committed hash
if (!existsSync(hashFilePath)) {
  console.error("✗ Drift detected: src/.spec-hash not found.");
  console.error("  Run `pnpm --filter @delegolabs/api-generated generate` and commit the output.");
  process.exit(1);
}

const committedHash = readFileSync(hashFilePath, "utf8").trim();

if (currentHash !== committedHash) {
  console.error("✗ Drift detected: openapi.yaml has changed but the generated client is stale.");
  console.error(`  Spec hash:      ${currentHash}`);
  console.error(`  Generated hash: ${committedHash}`);
  console.error("\n  Fix: run `pnpm --filter @delegolabs/api-generated generate` and commit the result.");
  process.exit(1);
}

console.log(`✓ No drift detected — generated client matches spec (hash: ${currentHash})`);
process.exit(0);
