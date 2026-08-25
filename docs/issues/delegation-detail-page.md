---
name: Feature request
about: Suggest a feature for Delego
title: "[Feature] Delegation detail page with Activity/Orders/Escrows tabs"
labels: enhancement
---

## Problem

The delegation page (#293) lists delegations, but the per-delegation drilldown scatters related records. Orders and escrows each carry their own timelines (#295, #307), and there's no single place to see everything about one delegation.

## Proposed solution

- Route `/delegations/[id]`: overview header (status, limits via FE-018, expiry countdown reusing #473's component) + tabbed sections: Activity | Orders | Escrows.
- Activity tab renders the shared event timeline (consume FE-027's component) fed by delegation-scoped events.
- Orders/Escrows tabs embed the existing lists filtered to this delegation, with links to full pages.

## Alternatives considered

Keeping orders/escrows/activity as separate scattered views the user has to filter manually by delegation — rejected because it doesn't consolidate the drilldown as intended.

## Additional context

**Tasks**
- [ ] Route `/delegations/[id]`: overview header (status, limits via FE-018, expiry countdown reusing #473's component) + tabbed sections: Activity | Orders | Escrows
- [ ] Activity tab renders the shared event timeline (consume FE-027's component) fed by delegation-scoped events
- [ ] Orders/Escrows tabs embed the existing lists filtered to this delegation, with links to full pages

**Acceptance criteria**
- [ ] Deep link loads directly (unknown id → styled not-found)
- [ ] Tab state reflects in URL hash/query for shareability

Related: #293, #295, #307, #473, FE-018, FE-027
