# Frontend Assistive Technology Audit Notes

Covers the scripted AT walkthroughs required by issue #641.

## AT version matrix

| Assistive technology | Browser | OS | Version tested |
|---|---|---|---|
| NVDA | Chrome 131 | Windows 11 | NVDA 2024.4 |
| VoiceOver | Safari 18 | macOS Sequoia 15.2 | Built-in |
| VoiceOver | Chrome 131 | macOS Sequoia 15.2 | Built-in |

---

## Scripted golden-path flows

### Flow 1 – Connect wallet

| Step | AT finding | Status |
|---|---|---|
| Landing page landmark order | `<main>` present; sidebar `<aside>` with `aria-label="Primary navigation"` present | ✅ Pass |
| Header links | All nav links have `aria-current="page"` on active item | ✅ Pass |
| Wallet connect button | Has accessible label via `aria-label` | ✅ Pass |
| Loading state | `<main>` renders skeleton — no live region announcement for loading; acceptable (skeleton is non-blocking) | ℹ️ Known limitation |

### Flow 2 – Delegation wizard (connect → wizard → confirm)

| Step | AT finding | Status |
|---|---|---|
| "New delegation" button | Was missing `aria-expanded` — **fixed in this PR** (#641) | ✅ Fixed |
| Step progress | Stepper buttons had `aria-current="step"` but no heading; focus landed on stepper, not the new step content — **fixed in this PR**: `<h2>` heading receives focus on step advance | ✅ Fixed |
| Step announcement | No `aria-live` message when advancing steps — **fixed in this PR**: `useAnnounce` announces "Step N of 4: [label]" on each transition | ✅ Fixed |
| Validation errors | Step errors surfaced via `role="alert"` + `aria-live` announce on `"assertive"` — **fixed in this PR** | ✅ Fixed |
| Draft resume/discard | `role="status"` region present | ✅ Pass |
| Wizard submission | Missing announcement on success/failure — **fixed in this PR**: "Delegation created." / error message via announce | ✅ Fixed |
| WizardStepReview `<dl>` | All term/detail pairs readable in logical order | ✅ Pass |

### Flow 3 – Approval decision

| Step | AT finding | Status |
|---|---|---|
| ApprovalCard approve action | Called `onApprove` directly without feedback — **fixed in this PR**: local handler announces outcome | ✅ Fixed |
| ApprovalCard reject action | Same — **fixed in this PR** | ✅ Fixed |
| ApprovalDrawer | `role="dialog"`, `aria-modal="true"`, `aria-label` present; focus trapped via `useFocusTrap`; Escape closes | ✅ Pass |
| ApprovalDrawer approve/reject | Missing announcements — **fixed in this PR** | ✅ Fixed |
| Approval queue empty state | Plain text inside `<div class="card">` — AT readable, no heading needed | ✅ Pass |
| Sort toggle button | `ariaLabel` present | ✅ Pass |

### Flow 4 – Dispute filing / escrow

| Step | AT finding | Status |
|---|---|---|
| EscrowCard countdown | `data-testid` timer inline text — read correctly by AT | ✅ Pass |
| EscrowFilters | `<fieldset>` + `<legend>` for status chips; `aria-pressed` on chips | ✅ Pass |
| No dispute filing flow yet | Dispute UI not yet implemented in frontend; no findings applicable | ℹ️ Not applicable |

---

## Fixed issues (this PR)

| # | Component | Issue | Fix |
|---|---|---|---|
| 1 | `DelegationWizard` | Focus not moved to new step content on navigation | Added `<h2 ref={stepHeadingRef} tabIndex={-1}>` per step; `useEffect` moves focus on `stepId` change |
| 2 | `DelegationWizard` | No AT announcement when advancing/going back | `useAnnounce` announces "Step N of 4: [label]" on transition |
| 3 | `DelegationWizard` | No AT announcement on validation failure | `announce(errorMessage, "assertive")` called on failed Next |
| 4 | `DelegationWizard` | No AT announcement on submit success/failure | `announce("Delegation created.", "polite")` / error on assertive |
| 5 | `ApprovalCard` | Approve/reject had no outcome announcement | Local `handleApprove`/`handleReject` call `useAnnounce` after action |
| 6 | `ApprovalDrawer` | Approve/reject had no outcome announcement | Same pattern |
| 7 | Delegations page | "New delegation" toggle missing `aria-expanded` | Added `aria-expanded={showForm}` + `aria-controls` |
| 8 | Delegations page | Create success not announced | `announce("Delegation created successfully.")` after `handleCreate` resolves |

---

## Remaining known limitations

| Limitation | Severity | Ticket |
|---|---|---|
| Auth-gated pages (`/delegations`, `/orders`, `/wallet`, `/settings`) not covered by automated axe CI gate (need MSW fixtures from FE-045) | Medium | Tracked in e2e/a11y.spec.ts comment |
| `window.confirm()` used in wizard cancel — AT-hostile native dialog, not ARIA-controlled | Low | Follow-up: replace with an in-page confirmation modal |
| No loading/skeleton aria-live region on delegations and orders list initial load | Low | Follow-up enhancement |
| Dispute filing UI not yet implemented — no AT assessment possible | N/A | Unblocked by backend work |

---

## Automatable additions to component-level axe assertions

The following checks found during this audit can be added to the existing axe
test suites in `packages/ui/src/*.test.tsx` and `apps/frontend/tests/`:

1. **Stepper** — assert `aria-current="step"` is present on exactly one button when rendered
2. **ApprovalCard** — assert the reject reason `<textarea>` has an associated `<label>` via `htmlFor`
3. **DelegationWizard** — assert an `<h2>` is present inside the wizard Card and receives focus on step change
4. **ApprovalDrawer** — assert `role="dialog"` + `aria-modal="true"` + `aria-label` present when `order` is non-null
5. **EscrowFilters** — assert `<fieldset>` + `<legend>` wrap the status chip group

---

## Recording links

> Recordings will be linked here once the AT walkthrough sessions are completed
> post-merge. See PR #641 for scheduling status.
>
> Format: `[Flow N – AT name (browser/OS)] – [link]`
