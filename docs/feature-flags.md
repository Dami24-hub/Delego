# Feature Flags Architecture & Developer Guide

This document describes the feature flag system in Delego (`@delegolabs/web`), designed for dark-launching mainnet features (such as FE-013 Client-side Soroban signing for escrow release and approval confirmations) with static tree-shaking support and default-deny safety guarantees.

---

## 1. Overview

Feature flags allow developers and operators to deploy code safely to production behind dark-launch flags, enabling or disabling features via environment variables (`NEXT_PUBLIC_FEATURE_*`) without requiring runtime remote fetches or third-party SDK dependencies.

### Core Principles
- **Static Analysis & Tree-Shaking**: Flag accesses reference literal `process.env.NEXT_PUBLIC_FEATURE_*` variables so Next.js, Webpack, and Turbopack can inline values at build time and perform dead-code elimination.
- **Default-Deny Policy**: Any unknown flag name, unconfigured variable, or non-truthy value evaluates strictly to `false` in both production and development environments.
- **Typed Registry**: All supported flags are defined with TypeScript types in `apps/frontend/lib/featureFlags.tsx`.
- **Zero-Latency Client Evaluation**: Reads directly from static environment variables and React context without network latency.

---

## 2. Usage Examples

### Using the `<IfFeature>` Wrapper Component

Use `<IfFeature>` to conditionally render components or fallback views:

```tsx
import { IfFeature } from "@/components/providers/FeatureFlagProvider";

export function EscrowReleaseButton() {
  return (
    <IfFeature
      name="CLIENT_SIDE_SIGNING"
      fallback={<LegacyServerReleaseButton />}
    >
      <ClientSideSorobanReleaseButton />
    </IfFeature>
  );
}
```

### Using the `useFeatureFlag` Hook

Use the `useFeatureFlag(name)` hook inside custom components or business logic:

```tsx
import { useFeatureFlag } from "@/lib/featureFlags";

export function useSigningMethod() {
  const clientSideSigning = useFeatureFlag("CLIENT_SIDE_SIGNING");

  if (clientSideSigning) {
    return "soroban-client";
  }
  return "backend-relayed";
}
```

---

## 3. Environment Variable Format

Feature flags are configured in environment files (`.env.local`, `.env.production`) using the `NEXT_PUBLIC_FEATURE_` prefix:

```bash
# Enable client-side Soroban signing
NEXT_PUBLIC_FEATURE_CLIENT_SIDE_SIGNING=true
```

### Accepted Truthy Values
Values are case-insensitive and trimmed. The following string values evaluate to `true`:
- `"true"`
- `"1"`
- `"yes"`
- `"on"`

Any other string (`"false"`, `"0"`, `"off"`), missing key, or undefined value evaluates to `false` (default-deny).

---

## 4. Process for Adding a New Feature Flag

Follow these step-by-step instructions to add a new feature flag:

### Step 1: Register in `lib/featureFlags.tsx`
Add the flag short name and environment variable mapping to `KNOWN_FEATURE_FLAGS`:

```typescript
export const KNOWN_FEATURE_FLAGS = {
  CLIENT_SIDE_SIGNING: "NEXT_PUBLIC_FEATURE_CLIENT_SIDE_SIGNING",
  NEW_FEATURE_NAME: "NEXT_PUBLIC_FEATURE_NEW_FEATURE_NAME",
} as const;
```

### Step 2: Add Static Accessor Switch Case
Add explicit property access to `getStaticEnvFlag(name)` so bundlers can tree-shake dead code at build time:

```typescript
export function getStaticEnvFlag(name: string): string | undefined {
  switch (name) {
    case "CLIENT_SIDE_SIGNING":
    case "NEXT_PUBLIC_FEATURE_CLIENT_SIDE_SIGNING":
      return process.env.NEXT_PUBLIC_FEATURE_CLIENT_SIDE_SIGNING;
    case "NEW_FEATURE_NAME":
    case "NEXT_PUBLIC_FEATURE_NEW_FEATURE_NAME":
      return process.env.NEXT_PUBLIC_FEATURE_NEW_FEATURE_NAME;
    default:
      // Fallback
  }
}
```

### Step 3: Document in `.env.example`
Add the new variable with default `false` to `.env.example`:

```bash
# --- Feature Flags ---
NEXT_PUBLIC_FEATURE_NEW_FEATURE_NAME=false
```

### Step 4: Add Unit Tests
Add test cases in `apps/frontend/lib/featureFlags.test.tsx` verifying enabled, disabled, and unknown flag behavior.

---

## 5. Process for Retiring a Feature Flag

When a feature is fully launched and validated in production:

1. **Clean up Application Code**: Remove `<IfFeature>` wrappers and `useFeatureFlag()` hook calls, making the enabled code path permanent and removing the fallback path.
2. **Unregister Flag**: Remove the flag entry from `KNOWN_FEATURE_FLAGS` and the switch case in `getStaticEnvFlag()` in `lib/featureFlags.tsx`.
3. **Clean Environment Files**: Remove `NEXT_PUBLIC_FEATURE_<NAME>` from `.env.example`, `.env.production`, and CI/CD environment configurations.
4. **Run Unit Tests & Type Check**: Execute `pnpm --filter @delegolabs/web test` and `pnpm --filter @delegolabs/web typecheck` to confirm clean removal without broken references.
