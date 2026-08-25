/**
 * Agent explainability data for an order awaiting approval (#530).
 *
 * Not yet part of the `Order` type from `@delegolabs/types` — the orchestrator
 * workflow events (#130, #206) that produce this trail aren't wired into the
 * order payload upstream yet. Modeled as a separate, fully-optional shape so
 * every field can be threaded through once the payload carries it, without
 * a breaking change to `Order` itself. Every field is optional so drawer
 * sections can collapse cleanly when the backend hasn't populated them.
 */

export interface PriceRangeHint {
  lowStroops: bigint;
  highStroops: bigint;
  /** e.g. "typical range for this product over the last 30 days" */
  label?: string;
}

export interface DecisionEvidenceLink {
  url: string;
  label: string;
}

export interface DelegationContext {
  /** Remaining spend allowance on the delegation, in stroops. */
  remainingLimitStroops: bigint;
}

export interface OrderExplainability {
  /** Agent's stated reasoning for choosing this item/price. */
  reasoning?: string;
  /** Per-line-item typical price hint, keyed by productId. */
  priceRangeByProductId?: Record<string, PriceRangeHint>;
  /** Per-line-item product imagery, keyed by productId. Not yet on `OrderLineItem`. */
  imageUrlByProductId?: Record<string, string>;
  /** Source URLs / comparable offers backing the agent's decision. */
  evidenceLinks?: DecisionEvidenceLink[];
  delegationContext?: DelegationContext;
}
