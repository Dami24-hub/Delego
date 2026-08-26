import { test, expect } from "./support/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * Automated axe-core scan gate (#557 FE-050).
 *
 * Public routes render with no setup. Protected routes (/delegations,
 * /orders, /wallet, /settings) redirect via middleware.ts unless the auth
 * cookie is present, so they run through the shared `test` base from
 * e2e/support/test.ts (FE-045 fixtures + auth cookie), extending the
 * original public-only list now that lands.
 */
const PUBLIC_ROUTES = ["/", "/onboarding", "/tracking", "/analytics", "/escrows", "/approvals"];

const PROTECTED_ROUTES = ["/delegations", "/orders", "/wallet", "/settings"];

for (const route of [...PUBLIC_ROUTES, ...PROTECTED_ROUTES]) {
  test(`${route} has no critical or serious axe violations`, async ({ page }) => {
    await page.goto(route);

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    const blocking = results.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious"
    );

    expect(
      blocking,
      blocking
        .map((v) => `${v.id} (${v.impact}): ${v.help}\n${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)
        .join("\n\n")
    ).toEqual([]);
  });
}
