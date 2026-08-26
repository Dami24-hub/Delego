/**
 * Centralized help-link anchor map (#638).
 *
 * Maps concept keys to their canonical documentation anchors. The base URL is
 * sourced from NEXT_PUBLIC_DOCS_URL (deployed docs site); in local dev it
 * falls back to the in-repo path so internal links still work.
 *
 * Dead-link coverage: the `scripts/check-help-links.mjs` script (also run as
 * a CI linkinator job) validates every URL in this map.
 */

export type HelpConceptKey =
  | "escrow"
  | "delegation-limits"
  | "dispute"
  | "network"
  | "privacy"
  | "delegation"
  | "approval";

interface HelpLink {
  /** Short label shown in the tooltip heading */
  label: string;
  /** One-sentence description shown in the tooltip body */
  description: string;
  /** Path fragment appended to DOCS_BASE_URL */
  path: string;
}

/**
 * Resolved at runtime from the env so Next.js can inject different values
 * per environment. Falls back to the canonical GitHub repo path for local dev.
 */
function getDocsBaseUrl(): string {
  // process.env is inlined at build time for NEXT_PUBLIC_ vars.
  const envUrl =
    typeof process !== "undefined"
      ? process.env.NEXT_PUBLIC_DOCS_URL
      : undefined;
  return envUrl ?? "https://github.com/DelegoLabs/Delego/blob/main/docs";
}

export const HELP_LINKS: Record<HelpConceptKey, HelpLink> = {
  escrow: {
    label: "Escrow mechanics",
    description:
      "Funds are held in a Soroban smart contract until the order is fulfilled or the timeout lapses.",
    path: "/architecture/system-design.md#escrow",
  },
  "delegation-limits": {
    label: "Delegation limits",
    description:
      "Per-transaction and total spending caps constrain how much an agent can spend on your behalf.",
    path: "/architecture/system-design.md#permissions",
  },
  dispute: {
    label: "Dispute flow",
    description:
      "Either party can raise a dispute; a resolver arbitrates and releases or refunds the escrowed funds.",
    path: "/architecture/system-design.md#dispute-resolution",
  },
  network: {
    label: "Stellar network",
    description:
      "Testnet uses test XLM only. Mainnet moves real funds — switch with care.",
    path: "/architecture/system-design.md#stellar-networks",
  },
  privacy: {
    label: "Privacy & data export",
    description:
      "You own your data. Export a full copy of your account at any time.",
    path: "/vision.md#data-sovereignty",
  },
  delegation: {
    label: "Delegations",
    description:
      "A delegation grants an AI agent scoped spending authority from your Stellar wallet.",
    path: "/architecture/system-design.md#delegations",
  },
  approval: {
    label: "Approval workflow",
    description:
      "High-value orders are held for your review before the agent can proceed.",
    path: "/architecture/system-design.md#approval-flows",
  },
};

/**
 * Returns the full URL for a given help concept key.
 * Safe to call in both server and client contexts.
 */
export function getHelpUrl(key: HelpConceptKey): string {
  const base = getDocsBaseUrl().replace(/\/$/, "");
  const { path } = HELP_LINKS[key];
  return `${base}${path}`;
}
