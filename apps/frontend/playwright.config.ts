import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3001",
    trace: "on-first-retry",
  },
  /**
   * FE-046: `toHaveScreenshot` pixel-diff tolerance and deterministic
   * rendering (fonts/animations frozen via e2e/support/visual.ts's
   * `freezeMotion`, applied per-test rather than globally so only the
   * `visual` project pays the extra init-script cost).
   */
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.02,
      animations: "disabled",
    },
  },
  projects: [
    { name: "chromium", testIgnore: /visual\//, use: { ...devices["Desktop Chrome"] } },
    {
      name: "visual",
      testDir: "./e2e/visual",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } },
    },
    {
      name: "visual-mobile",
      testDir: "./e2e/visual",
      use: { ...devices["Pixel 7"] },
    },
  ],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: "pnpm start",
        port: 3001,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
