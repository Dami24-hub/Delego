import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const HEALTH_RESPONSE = {
  data: {
    status: "ok",
    service: "gateway",
    version: "0.0.1",
    timestamp: "2026-01-01T00:00:00.000Z",
  },
  error: null,
};

function mockFetchOnce(body: unknown) {
  const fetchMock = vi.fn().mockResolvedValue({
    status: 200,
    json: async () => body,
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("api client", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.unstubAllGlobals();
  });

  it("instantiates the shared client using NEXT_PUBLIC_API_URL as the base URL", async () => {
    process.env.NEXT_PUBLIC_API_URL = "https://api.example.com";
    const fetchMock = mockFetchOnce(HEALTH_RESPONSE);

    const { api } = await import("./api.js");
    await api.health();

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.com/health",
      expect.anything()
    );
  });

  it("has no auth token by default", async () => {
    process.env.NEXT_PUBLIC_API_URL = "https://api.example.com";
    const { api } = await import("./api.js");

    expect(api.getToken()).toBeNull();
  });

  it("uses a custom base URL when constructed directly, stripping a trailing slash", async () => {
    const { DelegoClient } = await import("@delegolabs/sdk");
    const fetchMock = mockFetchOnce(HEALTH_RESPONSE);

    const client = new DelegoClient({ baseUrl: "https://custom.example.com/" });
    await client.health();

    expect(fetchMock).toHaveBeenCalledWith(
      "https://custom.example.com/health",
      expect.anything()
    );
  });

  it("retries transient GET failures without retrying POST requests", async () => {
    vi.useFakeTimers();
    const { createRetryingFetch } = await import("./api.js");
    const success = new Response(JSON.stringify(HEALTH_RESPONSE), { status: 200 });
    const baseFetch = vi
      .fn()
      .mockResolvedValueOnce(new Response("busy", { status: 503 }))
      .mockResolvedValueOnce(success);

    const retryingFetch = createRetryingFetch(baseFetch as typeof fetch, {
      baseDelayMs: 1,
      maxDelayMs: 1,
    });
    const resultPromise = retryingFetch("https://api.example.com/health");

    await vi.runAllTimersAsync();

    await expect(resultPromise).resolves.toBe(success);
    expect(baseFetch).toHaveBeenCalledTimes(2);

    await retryingFetch("https://api.example.com/orders", { method: "POST" });
    expect(baseFetch).toHaveBeenCalledTimes(3);
    vi.useRealTimers();
  });
});
