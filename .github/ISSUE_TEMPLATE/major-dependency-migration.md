---
name: Major dependency migration notes
about: Required companion issue when merging a Renovate major-version PR
title: "chore(deps): migrate [PACKAGE] to vX"
labels: dependencies, major, migration-notes
assignees: ''
---

## Package

<!-- e.g. next@16, react@20 -->

## Renovate PR

<!-- Link to the Renovate PR being merged -->

## Changelog / migration guide

<!-- Link to the official upgrade guide -->

## Breaking changes identified

<!-- List API removals, changed behaviour, new peer dependency requirements, etc. -->

- [ ] 

## Validation checklist

- [ ] Local dev build passes (`pnpm dev`)
- [ ] Unit tests pass (`pnpm test`)
- [ ] E2E golden paths pass (`pnpm test:e2e`)
- [ ] Production build passes (`pnpm build`)
- [ ] Tested in both light and dark mode
- [ ] No new TypeScript errors (`pnpm typecheck`)
- [ ] Second maintainer has approved the Renovate PR

## Notes

<!-- Anything else reviewers should know (config changes needed, follow-up tickets, etc.) -->
