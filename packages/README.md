# Packages

This directory contains shared libraries consumed by the Delego web application.

## Overview

This repository currently hosts one local workspace package. The SDK and types packages are published to GitHub Packages and consumed by the web app as regular dependencies (the utils package is also published there, though not currently a dependency of the web app).

## Packages

### @delegolabs/ui

Shared React component library for consistent UI across Delego applications.

- **Components**: Reusable React components (Button, Card, Input, Modal, etc.)
- **Styling**: Tailwind CSS integration
- **Theming**: Consistent design system
- **Accessibility**: WCAG compliant components

#### Usage

```typescript
import { Button, Card, Input } from '@delegolabs/ui';

function MyComponent() {
  return (
    <Card>
      <Input placeholder="Enter text" />
      <Button>Submit</Button>
    </Card>
  );
}
```

### Published packages (GitHub Packages)

The following packages are built and published from [DelegoLabs/Delego-backend](https://github.com/DelegoLabs/Delego-backend):

- **@delegolabs/sdk** — API client SDK for the Delego backend
- **@delegolabs/types** — Shared TypeScript type definitions
- **@delegolabs/utils** — Shared utility functions

```bash
# Install from GitHub Packages
pnpm add @delegolabs/sdk @delegolabs/types @delegolabs/utils
```

## Development

```bash
# Build the UI package
pnpm --filter @delegolabs/ui build

# Type-check
pnpm --filter @delegolabs/ui typecheck

# Test
pnpm --filter @delegolabs/ui test
```

## Best Practices

- **Single Responsibility**: Each package should have a single purpose
- **Minimal Dependencies**: Keep dependencies to a minimum
- **Type Safety**: Use TypeScript strict mode
- **Documentation**: Document all public APIs

## Documentation

- [UI Package README](./ui/README.md)

---

**Last Updated**: August 2026
