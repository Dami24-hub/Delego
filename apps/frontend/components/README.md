# Component Architecture & Import Boundaries

React components specific to the consumer web app.
Shared primitives live in `@delegolabs/ui`.

## Feature Boundaries

`components/` is organized into **feature directories**. Each feature owns its
internals — other features must never reach past a feature's `public.ts` barrel.

```
components/
  delegations/        ← delegations feature
    DelegationCard.tsx
    DelegationWizard.tsx
    wizard/           ← internal sub-components, not exported from public.ts
      WizardStepAgent.tsx
    public.ts         ← the ONLY import surface for other features
  orders/
    ApprovalDrawer.tsx
    public.ts
  escrows/
    EscrowCard.tsx
    public.ts
  wallet/
    WalletConnectButton.tsx
    public.ts
  ...
  HomeContent.tsx     ← shared (root-level), may import from public.ts barrels
  DelegationSkeleton.tsx
  OrderSkeleton.tsx
```

### The Rule

```
components/<feature-A>/**  →  may NOT import  →  components/<feature-B>/**
```

**Allowed:**
```ts
// ✅ import via public barrel
import { ExpiryCountdown } from "../delegations/public";
import { WalletConnectButton } from "../wallet/public";
```

**Blocked (fails lint with a helpful message):**
```ts
// ❌ direct internal import — ESLint boundaries/element-types error:
//   "Cross-feature import blocked. Import via the feature's public.ts barrel instead."
import { ExpiryCountdown } from "../delegations/ExpiryCountdown";
import { WizardStepAgent } from "../delegations/wizard/WizardStepAgent";
```

### Why

As features grow, direct internal imports create invisible coupling that
prevents extracting individual features into standalone packages later. The
public barrel approach makes the intended API surface explicit and auditable.

Shared utilities (hooks, lib, packages/ui) are always importable by any feature —
the boundary rule only governs `components/**` → `components/**` cross-feature paths.

### ESLint Enforcement

The rule is enforced by [`eslint-plugin-boundaries`](https://www.npmjs.com/package/eslint-plugin-boundaries)
configured in `.eslintrc.json`. Run `pnpm lint` to verify. Violations fail CI.

To deliberately waive a boundary (with justification) add an inline comment:
```ts
// eslint-disable-next-line boundaries/element-types -- [reason for waiver]
import { Foo } from "../other-feature/Foo";
```

Waivers must include a justification comment or the PR reviewer should reject them.

### Shared Utilities

The following are **never** subject to the boundary rule and can be imported freely from any component:

| Path | What it contains |
|------|-----------------|
| `@delegolabs/ui` | Design-system primitives (Button, Card, etc.) |
| `@delegolabs/types` | Shared TypeScript types |
| `@delegolabs/utils` | Pure utility functions |
| `hooks/` | React hooks (non-feature-specific) |
| `lib/` | Pure logic helpers |
