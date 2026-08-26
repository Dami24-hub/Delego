/**
 * Guided tour step definitions (#637).
 *
 * This is the single config file for all tour content. Copy can be edited
 * here without touching any component logic.
 *
 * Each step references a DOM element via `anchorSelector`. If the element
 * is not found in the DOM when the step becomes active it is skipped
 * gracefully — the tour engine moves to the next step automatically.
 */

export interface TourStep {
  /** Unique identifier for this step */
  id: string;
  /** CSS selector for the element this step anchors to */
  anchorSelector: string;
  /** Short heading shown in the spotlight popover */
  title: string;
  /** Body copy shown in the spotlight popover */
  body: string;
  /**
   * Where to position the popover relative to the anchor.
   * "auto" picks whichever side has more viewport space.
   */
  placement?: "top" | "bottom" | "left" | "right" | "auto";
}

/**
 * The ordered sequence of tour steps.
 * Home → wallet/network badge → delegations → approvals inbox → help affordance.
 */
export const TOUR_STEPS: TourStep[] = [
  {
    id: "home",
    anchorSelector: "h1",
    title: "Welcome to Delego",
    body: "This is your command centre for AI-delegated commerce. Let's take a quick look around.",
    placement: "bottom",
  },
  {
    id: "network-badge",
    anchorSelector: ".network-toggle",
    title: "Network indicator",
    body: "This badge shows which Stellar network is active. Testnet is safe to experiment on — Mainnet moves real funds.",
    placement: "bottom",
  },
  {
    id: "delegations",
    anchorSelector: 'a[href="/delegations"], [data-nav="delegations"]',
    title: "Delegations",
    body: "Create and manage delegations here — grant AI agents scoped spending authority with limits you control.",
    placement: "right",
  },
  {
    id: "approvals",
    anchorSelector: 'a[href="/approvals"], [data-nav="approvals"]',
    title: "Approvals inbox",
    body: "High-value orders land here for your review before the agent can proceed. You stay in control.",
    placement: "right",
  },
  {
    id: "help",
    anchorSelector: ".help-link-wrapper",
    title: "Contextual help",
    body: "Whenever you see a ? icon, click it for a quick explanation and a link to the full docs.",
    placement: "top",
  },
];
