---
name: Feature request
about: Suggest a feature for Delego
title: "[Feature] Spending headroom visualization (LimitUsageBar)"
labels: enhancement
---

## Problem

Spending policy configuration already exists (#296), and the last-spend ledger fields landed on-chain (#106, #153), so the raw data needed to compute usage is available. However, users currently only see static numbers — a cap, a spent amount — with no visual sense of how much headroom remains for the current period or when that period rolls over. This makes it hard to gauge, at a glance, whether an agent is approaching its limit, and it pushes users to either under-trust delegations (revoking too early) or over-trust them (getting surprised by a block near period end).

## Proposed solution

- Build a `LimitUsageBar` component showing spent vs. cap for the current period, along with the period rollover timestamp.
- Apply color thresholds to communicate urgency: under 70% usage is calm, 70–90% is amber, over 90% is red — all respecting the dark mode tokens from #310.
- Place the component in two densities: compact on delegation cards (list views), and expanded on the delegation detail page, where it also surfaces ledger entries from the spend history getters (#37/#227).
- When usage is near the limit, surface a suggestion to enable or tighten the approval threshold, giving users a direct next action instead of just a warning.

## Alternatives considered

Leaving spend data as static numbers and relying on users to do the mental math themselves — rejected because it doesn't scale as delegation counts grow and hides how close a delegation is to blocking new spends until it actually happens.

## Additional context

**Tasks**
- [ ] `LimitUsageBar` component: spent vs. cap for the current period with period rollover timestamp
- [ ] Color thresholds (<70% calm, 70–90% amber, >90% red) respecting dark mode tokens (#310)
- [ ] Place on delegation cards (compact) and detail page (expanded with ledger entries from the spend history getters #37/#227)
- [ ] Near-limit state suggests enabling/tightening the approval threshold

**Acceptance criteria**
- [ ] Numbers reconcile with on-chain ledger values shown elsewhere
- [ ] Period boundary math has unit tests incl. timezone edges

Related: #296, #106, #153, #310, #37, #227
