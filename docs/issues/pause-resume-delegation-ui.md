---
name: Feature request
about: Suggest a feature for Delego
title: "[Feature] Pause/Resume toggle for delegations"
labels: enhancement
---

## Problem

Grant pause/resume already exists on-chain and in services (#35, #186, #233), but there is no consumer-facing UI for it. Today, the only way for a user to stop an agent temporarily is to revoke the delegation outright, which is destructive and loses the delegation's configuration/history.

## Proposed solution

- Pause/Resume toggle on the delegation detail page and in the row overflow menu, with a confirm modal explaining paused semantics (no new spends; pending approvals stay decidable).
- Paused visual state (badge + dimmed card) applied consistently across all delegation lists.
- Optimistic update on toggle, with rollback if the API call fails.

## Alternatives considered

Requiring users to revoke and recreate delegations to pause spending — rejected because it's destructive and doesn't match the on-chain/service capability that already exists.

## Additional context

**Tasks**
- [ ] Pause/Resume toggle on delegation detail and row overflow menu, with confirm modal explaining paused semantics (no new spends; pending approvals stay decidable)
- [ ] Paused visual state (badge + dimmed card) across lists
- [ ] Optimistic update with rollback on API failure

**Acceptance criteria**
- [ ] Paused delegation blocks new agent-initiated orders end-to-end on testnet
- [ ] State persists correctly across refresh and network switch

Related: #35, #186, #233
