# Apps

This directory contains the consumer-facing **Delego web application**.

## Applications

| App | Package | Port | Tech Stack | Description |
|-----|---------|------|------------|-------------|
| [frontend](./frontend) | `@delegolabs/web` | 3001 | Next.js, React, TypeScript | Customer web app for wallet connection, delegation management, and order tracking |

## Customer Web App (`apps/frontend`)

The customer web application is the primary interface for users to interact with Delego. It provides:

- **Wallet Connection**: Connect Stellar wallets and manage accounts
- **Delegation Management**: Create and manage AI agent delegations
- **Order Creation & Tracking**: Initiate and monitor purchases through AI agents
- **Approval Workflows**: Review and approve agent actions
- **Escrow Tracking**: Monitor escrow-backed purchases
- **Spending Analytics**: Overview of delegated spending
- **Notifications**: In-app alerts and updates

### Tech Stack

- **Framework**: Next.js 15 (App Router)
- **UI Library**: React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Context + Hooks
- **HTTP Client**: `@delegolabs/sdk`

### Development

```bash
# From the repository root
pnpm dev

# Or run the app directly
pnpm --filter @delegolabs/web dev
```

The web app will be available at http://localhost:3001

### Key Pages

- `/` - Home / overview
- `/delegations` - Delegation management
- `/approvals` - Pending approvals
- `/orders` - Order history and tracking
- `/escrows` - Escrow tracking
- `/wallet` - Wallet management
- `/analytics` - Spending analytics
- `/settings` - Account preferences
- `/onboarding` - Guided setup

## Architecture

1. **Component-Based UI**: Modular, reusable components
2. **Custom Hooks**: Business logic encapsulated in hooks
3. **Type Safety**: Full TypeScript coverage
4. **API Layer**: Centralized API client via `@delegolabs/sdk`
5. **State Management**: React Context for global state
6. **Routing**: Next.js App Router

### Data Flow

```
User Interaction
    ↓
Component
    ↓
Custom Hook
    ↓
API Client (@delegolabs/sdk)
    ↓
Delego API Gateway (DelegoLabs/Delego-backend)
    ↓
Backend Services
```

## Shared Dependencies

The app consumes shared packages:

- **@delegolabs/ui** — Shared React components (local workspace package)
- **@delegolabs/sdk** — API client SDK (GitHub Packages)
- **@delegolabs/types** — Shared TypeScript types (GitHub Packages)
- **@delegolabs/utils** — Shared utility functions (GitHub Packages)

## Documentation

- [Web App README](./frontend/README.md) - Detailed web app documentation
- [UI Component Library](../packages/ui/README.md) - UI component library

---

**Last Updated**: August 2026
