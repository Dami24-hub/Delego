import type { Page } from "@playwright/test";

const THEME_STORAGE_KEY = "delego-theme";

/**
 * Deterministic-rendering setup for FE-046 visual regression: forces the
 * theme (bypassing prefers-color-scheme/localStorage timing), and disables
 * CSS animations/transitions/caret so two runs of the same page pixel-match.
 */
export async function freezeMotion(page: Page) {
  await page.addInitScript(() => {
    const style = document.createElement("style");
    style.textContent = `
      *, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
        caret-color: transparent !important;
      }
    `;
    document.addEventListener("DOMContentLoaded", () => {
      document.head.appendChild(style);
    });
  });
}

export async function setTheme(page: Page, theme: "light" | "dark") {
  await page.addInitScript(
    ({ key, value }) => {
      window.localStorage.setItem(key, value);
    },
    { key: THEME_STORAGE_KEY, value: theme }
  );
}

/**
 * Playwright `mask` locators for regions that legitimately differ run-to-run.
 * Fixture data is pinned to a fixed date (see e2e/support/fixtures.ts), so
 * rendered dates are otherwise deterministic — only genuinely wall-clock-
 * derived UI (the connected wallet address chrome, and the escrow countdown
 * computed from "now") needs masking.
 */
export function dynamicRegionMasks(page: Page) {
  return [page.locator(".wallet-address"), page.locator("[data-testid='escrow-countdown']")];
}
