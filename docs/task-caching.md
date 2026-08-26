# Task-output caching (#635)

CI used to rebuild and re-typecheck the whole monorepo on every job (lint,
type-check, test, build each did a cold `pnpm install` + build), even when
a PR only touched one package. This wires [Turborepo](https://turbo.build)
around `build`/`typecheck`/`lint`/`test` with content-hash caching, backed
by GitHub Actions' own cache (`actions/cache`) — no paid remote-cache
service required.

## Why Turborepo, not Nx

Both would work here; Turborepo was picked because:

- **Fits the existing shape exactly.** This is a small, flat pnpm workspace
  (`apps/frontend` + 3 packages) already scripted with `pnpm -r <script>`.
  Turborepo's `turbo.json` task graph is a near-drop-in replacement for
  that — each script keeps its existing `package.json` definition, and
  `turbo run <script>` just adds caching + a dependency graph on top. Nx
  wants project-level config (`project.json` or inferred targets) and
  generally expects more of the repo to be "Nx-shaped."
- **Free remote caching via GitHub Actions, without a hosted service.**
  Turborepo's local/self-hosted cache is just a content-addressed
  directory (`.turbo/`) — trivial to persist with `actions/cache`, which
  is what this PR does. Nx's free tier for the same thing (Nx Cloud) is a
  third-party hosted service; getting the equivalent "no paid service"
  behavior with Nx means hand-rolling your own cache server or accepting
  local-only caching in CI (where it doesn't help, since every job starts
  from a clean runner).
- **Smaller footprint for 4 packages.** Nx's value shows up more clearly
  past a few dozen projects (dep-graph visualization, generators,
  plugins). At this repo's current size, that's overhead without payoff.

If the monorepo grows substantially (many more packages, need for
generators/plugins, or a real remote-cache budget), it's worth
re-evaluating — this isn't a one-way door.

## Task graph

See `turbo.json` at the repo root. The key correctness rule: `typecheck`
and `test` (and the default `test:coverage`) depend on `^build` — the
`^` means "this task's package dependencies' `build` task," so
`packages/ui`'s `build` (and `packages/types`, `packages/api-generated`)
runs before `apps/frontend`'s `typecheck`/`test`, matching the actual
import graph (`apps/frontend` imports compiled output from
`@delegolabs/ui`). `build` itself depends on `^build` too, so the whole
workspace builds in true dependency order rather than by luck of
`pnpm -r`'s package.json ordering.

`lint` and the `check:*` scripts have no `dependsOn` — they only read
source, not other packages' build output.

## Verifying correctness: a forced cache miss

To confirm the dependency graph is real and not just "it happened to pass
once":

```bash
# Warm the cache
pnpm build

# Edit a file deep in packages/ui (content, not just mtime — turbo hashes
# file contents, so `touch` alone won't invalidate anything), run again,
# and watch turbo's own output — it should show packages/ui:build
# re-running (cache miss) and, critically, apps/frontend:typecheck /
# apps/frontend:test ALSO re-running (they depend on packages/ui's build
# output), while packages/types and packages/api-generated stay cached
# (untouched, no dependency on ui).
echo "// cache-bust" >> packages/ui/src/Button.tsx
pnpm build && pnpm typecheck
git checkout -- packages/ui/src/Button.tsx  # revert the test edit
```

Verified locally against `packages/ui` alone (the only package installable
without GitHub Packages credentials in this environment — see
`README.md`'s Authentication section): `pnpm build` cache-misses and
rebuilds on a real content change, cache-hits ("FULL TURBO") on a rerun
with no change, and correctly no-ops `packages/types` (which has no
`build` script) rather than erroring.

turbo's terminal output labels each task `cache hit` or a build/run log on
miss — a passing run where only `packages/ui` and `apps/frontend` show
fresh output (not `packages/types`/`packages/api-generated`) is the
correctness check for "exactly downstream tasks rerun."

## CI wiring

Every job in `.github/workflows/ci.yml` that runs a turbo-wrapped script
(`lint`, `type-check`, `test`, `build`) restores `.turbo` from
`actions/cache` before running, keyed on the runner OS plus a hash of
every source file turbo's task graph reads (mirroring `turbo.json`'s
`inputs`) and `pnpm-lock.yaml`. `actions/cache` saves automatically at the
end of the job when the key was a miss, so no separate save step is
needed — see the `bundle-size` job for contrast, which explicitly forces
a save every run because it wants a *rolling* baseline rather than an
immutable cache entry.

A second run of an unchanged tree should show every relevant job's log
dominated by `cache hit` lines rather than actual build/test output — that
"logs demonstrate it" check is the other half of this issue's acceptance
criteria, alongside the forced-miss check above.

## Local parity

`pnpm build` / `pnpm typecheck` / `pnpm lint` / `pnpm test` at the repo
root now all run through `turbo run <task>` — the exact same task graph
and caching CI uses. There's no separate "CI-only" invocation to keep in
sync; if it's green with a warm local `.turbo/` cache, that's the same
graph CI would produce with its own cache warm.

`pnpm clean` also removes `.turbo/` (in addition to the existing
`dist`/`.next`/`node_modules` cleanup), for a genuinely from-scratch
local run.
