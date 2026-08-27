import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";

describe("fetchXlmRate", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    window.localStorage.clear();
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.unstubAllGlobals();
  });

  it("returns the static fallback when no rate URL is configured", async () => {
    delete process.env.NEXT_PUBLIC_XLM_RATE_URL;
    const { fetchXlmRate } = await import("./rates.js");

    const snapshot = await fetchXlmRate();

    expect(snapshot.isFallback).toBe(true);
    expect(snapshot.xlmUsdRate).toBeGreaterThan(0);
  });

  it("fetches and caches a live rate when the endpoint responds", async () => {
    process.env.NEXT_PUBLIC_XLM_RATE_URL = "https://rates.example.com/xlm-usd";
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue({
          ok: true,
          json: async () => ({ xlmUsdRate: 0.15 }),
        })
    );
    const { fetchXlmRate } = await import("./rates.js");

    const snapshot = await fetchXlmRate();

    expect(snapshot).toMatchObject({ xlmUsdRate: 0.15, isFallback: false });
  });

  it("falls back to the cached rate when the endpoint fails", async () => {
    process.env.NEXT_PUBLIC_XLM_RATE_URL = "https://rates.example.com/xlm-usd";
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue({
          ok: true,
          json: async () => ({ xlmUsdRate: 0.2 }),
        })
    );
    const { fetchXlmRate } = await import("./rates.js");
    await fetchXlmRate();

    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("network down"))
    );
    const snapshot = await fetchXlmRate();

    expect(snapshot).toMatchObject({ xlmUsdRate: 0.2, isFallback: false });
  });

  it("falls back to the static rate when the endpoint fails and nothing is cached", async () => {
    process.env.NEXT_PUBLIC_XLM_RATE_URL = "https://rates.example.com/xlm-usd";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("network down"))
    );
    const { fetchXlmRate } = await import("./rates.js");

    const snapshot = await fetchXlmRate();

    expect(snapshot.isFallback).toBe(true);
  });

  it("falls back when the endpoint returns a non-numeric rate", async () => {
    process.env.NEXT_PUBLIC_XLM_RATE_URL = "https://rates.example.com/xlm-usd";
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue({
          ok: true,
          json: async () => ({ xlmUsdRate: "not-a-number" }),
        })
    );
    const { fetchXlmRate } = await import("./rates.js");

    const snapshot = await fetchXlmRate();

    expect(snapshot.isFallback).toBe(true);
  });
});

describe("isRateStale", () => {
  it("treats a fallback snapshot as always stale", async () => {
    const { isRateStale } = await import("./rates.js");
    expect(
      isRateStale({ xlmUsdRate: 0.12, fetchedAt: Date.now(), isFallback: true })
    ).toBe(true);
  });

  it("treats a fresh live snapshot as not stale", async () => {
    const { isRateStale } = await import("./rates.js");
    expect(
      isRateStale({
        xlmUsdRate: 0.12,
        fetchedAt: Date.now(),
        isFallback: false,
      })
    ).toBe(false);
  });

  it("treats an old live snapshot as stale", async () => {
    const { isRateStale } = await import("./rates.js");
    expect(
      isRateStale({
        xlmUsdRate: 0.12,
        fetchedAt: Date.now() - 10 * 60 * 1000,
        isFallback: false,
      })
    ).toBe(true);
  });
});
