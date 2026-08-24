import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * Automated axe-core scan gate (#557 FE-050).
 *
 * Only covers routes that render without an auth cookie — /delegations,
 * /orders, /wallet, and /settings redirect via middleware.ts and need the
 * MSW fixtures from FE-045 (not landed yet) to render meaningfully. Extend
 * this list once that lands.
 */
const PUBLIC_ROUTES = [
  "/",
  "/onboarding",
  "/tracking",
  "/analytics",
  "/escrows",
  "/approvals",
];

for (const route of PUBLIC_ROUTES) {
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
