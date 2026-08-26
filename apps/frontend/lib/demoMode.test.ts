// @vitest-environment jsdom

import { describe, it, expect, beforeEach } from "vitest";
import {
  isDemoMode,
  enableDemoMode,
  disableDemoMode,
  DEMO_WALLET_ADDRESS,
  DEMO_NETWORK,
  DEMO_NETWORK_PASSPHRASE,
} from "./demoMode";

describe("demoMode", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it("is off by default", () => {
    expect(isDemoMode()).toBe(false);
  });

  it("turns on after enableDemoMode()", () => {
    enableDemoMode();
    expect(isDemoMode()).toBe(true);
  });

  it("turns off after disableDemoMode()", () => {
    enableDemoMode();
    disableDemoMode();
    expect(isDemoMode()).toBe(false);
  });

  it("persists across calls within the same session", () => {
    enableDemoMode();
    expect(isDemoMode()).toBe(true);
    expect(isDemoMode()).toBe(true);
  });

  it("exports a synthetic wallet identity distinguishable from a real address", () => {
    expect(DEMO_WALLET_ADDRESS).toMatch(/^G/);
    expect(DEMO_WALLET_ADDRESS).toContain("DEMO");
    expect(DEMO_NETWORK).toBe("TESTNET");
    expect(DEMO_NETWORK_PASSPHRASE).toBeTruthy();
  });
});
