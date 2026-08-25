#!/usr/bin/env node
/**
 * Validates every URL in the centralized help-link anchor map (#638).
 *
 * Fetches each URL (HEAD request) and reports any that return a non-2xx
 * status or fail to connect. Run locally via:
 *
 *   pnpm --filter @delegolabs/web check:help-links
 *
 * Also executed in CI as the `help-links` job in `.github/workflows/ci.yml`.
 *
 * The DOCS_BASE_URL override lets CI point at the deployed docs site; locally
 * it defaults to the GitHub raw path so links resolve without a local server.
 */

const BASE_URL =
  process.env.NEXT_PUBLIC_DOCS_URL ??
  "https://github.com/DelegoLabs/Delego/blob/main/docs";

/** Mirror of lib/helpLinks.ts — kept in sync manually (TS isn't available here). */
const HELP_LINKS = {
  escrow: "/architecture/system-design.md#escrow",
  "delegation-limits": "/architecture/system-design.md#permissions",
  dispute: "/architecture/system-design.md#dispute-resolution",
  network: "/architecture/system-design.md#stellar-networks",
  privacy: "/vision.md#data-sovereignty",
  delegation: "/architecture/system-design.md#delegations",
  approval: "/architecture/system-design.md#approval-flows",
};

const failures = [];

async function checkLink(key, path) {
  const url = BASE_URL.replace(/\/$/, "") + path;
  try {
    const res = await fetch(url, { method: "HEAD", redirect: "follow" });
    if (!res.ok) {
      failures.push({ key, url, status: res.status });
    } else {
      console.log(`  ✓ ${key}: ${res.status}`);
    }
  } catch (err) {
    failures.push({ key, url, error: err.message });
  }
}

console.log(`Checking help links against: ${BASE_URL}\n`);

await Promise.all(
  Object.entries(HELP_LINKS).map(([key, path]) => checkLink(key, path))
);

if (failures.length === 0) {
  console.log(`\n✓ All ${Object.keys(HELP_LINKS).length} help links resolved successfully.`);
  process.exit(0);
} else {
  console.error(`\n✗ ${failures.length} help link(s) failed:`);
  for (const { key, url, status, error } of failures) {
    const detail = status ? `HTTP ${status}` : error;
    console.error(`  ${key}: ${url} — ${detail}`);
  }
  process.exit(1);
}
