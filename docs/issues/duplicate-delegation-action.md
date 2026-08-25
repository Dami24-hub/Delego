---
name: Feature request
about: Suggest a feature for Delego
title: "[Feature] Duplicate delegation action"
labels: enhancement
---

## Problem

Recurring grocery/subscriptions (top vision use case) mean users recreate near-identical delegations repeatedly. There's currently no fast path to do this from an existing delegation.

## Proposed solution

- "Duplicate" action on delegation rows/detail: opens the wizard (FE-016) pre-filled from the source, requiring fresh review before submit.
- Copy excludes volatile fields (remaining spends, ledger state) and forces expiry re-entry if the source expired.

## Alternatives considered

Requiring users to manually re-enter every field for a new, near-identical delegation — rejected because it's slow and error-prone for the top recurring-purchase use case.

## Additional context

**Tasks**
- [ ] "Duplicate" action on delegation rows/detail: opens the wizard (FE-016) pre-filled from the source, requiring fresh review before submit
- [ ] Copy excludes volatile fields (remaining spends, ledger state) and forces expiry re-entry if the source expired

**Acceptance criteria**
- [ ] Cloned delegation creation is ≤2 clicks from an existing row
- [ ] Expired-source clones cannot inherit past dates

Related: FE-016
