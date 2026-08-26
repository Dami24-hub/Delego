# Renovate Dependency Automation

Delego uses [Renovate](https://docs.renovatebot.com/) to keep dependencies
current while preventing silent breakage. The full config lives in
[`renovate.json`](../renovate.json) at the repo root.

---

## What merges itself (automerge)

| Condition | Behaviour |
|-----------|-----------|
| **Patch devDependency** (linters, type stubs, test tooling, bundler plugins) | PR auto-merges via squash commit once **all CI checks pass** (lint + unit tests + E2E + build). No human action required. |
| **Lockfile-only refresh** (no version changes) | Auto-merged on Monday morning before business hours. |

If CI is red the PR stays open and pings the `maintainers` team. Fix the
failure before the bot retries — it will not force-merge.

---

## What requires a human review

| Category | What to check |
|----------|---------------|
| **Minor/patch dependencies (non-dev, weekly batch)** | Skim the diff for any behaviour changes called out in the changelog. Run the app locally if the package touches a runtime critical path. |
| **Major versions (any package)** | Read the migration guide. Open a `major-dependency-migration` issue (template in `.github/ISSUE_TEMPLATE/`) with notes before merging the Renovate PR. |
| **React / Next.js majors** | Extra checklist is included in the PR body. Requires a second maintainer approval. |
| **Internal `@delegolabs/*` packages** | These are private packages — read the package CHANGELOG. Confirm no consumer-facing API changes. |
| **Security alerts** | These arrive immediately (ignore the weekly schedule) and are labelled `security` + `high-priority`. Review the advisory CVE and confirm the fix version covers it. |

---

## Branch protection interplay

Automerge only triggers when:

1. The branch protection rule **"Require status checks to pass before merging"**
   is satisfied (all CI jobs green: `lint`, `test`, `build`, `e2e`).
2. The PR has no requested changes from any reviewer.
3. The PR's head commit matches the base branch — no merge conflicts.

If your repo uses **required reviews** (e.g., CODEOWNERS), automerge will
wait until that review count is satisfied. For patch devDeps you can configure
Renovate's `platformAutomerge: true` to let GitHub merge directly without a
review if your branch protection allows it — check with your repo admin.

---

## Grouped vs individual PRs

- **Minor + patch non-dev**: One PR per week with all changes batched
  (`"all non-major dependencies"` group). Keeps the PR queue low.
- **Patch devDeps**: Also in the weekly batch but eligible for automerge.
- **Majors**: Always individual PRs — never grouped — so each can be
  reviewed and rolled back independently.
- **Security alerts**: Always individual and scheduled `"at any time"`.
- **Internal packages**: Always individual (pinned version bumps need context).

---

## Protected zones

| Package pattern | Policy |
|----------------|--------|
| `react`, `react-dom`, `next` majors | Human + migration-notes issue required |
| `@delegolabs/*` | Pinned to released tags; every bump is an explicit PR |
| Any vulnerability alert | Bypasses group schedule; individual PR immediately |

---

## Dependency Dashboard

Renovate opens a **Dependency Dashboard** issue in the repo that shows:
- All pending and in-flight PRs
- Packages awaiting rate-limiting (`prHourlyLimit: 2`, `prConcurrentLimit: 5`)
- Packages on the ignore list

Close the dashboard issue to re-trigger a full dependency scan.

---

## Dry-run validation

To preview what Renovate would create without opening real PRs:

```bash
# Requires Renovate CLI: npm install -g renovate
RENOVATE_TOKEN=<PAT> renovate --dry-run=full --log-level=debug \
  --repositories=DelegoLabs/Delego
```

Attach the `--dry-run` output to any PR that changes `renovate.json`.
