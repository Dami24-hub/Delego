import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useBalanceHistory } from "./useBalanceHistory";

describe("useBalanceHistory", () => {
  const mockAddress = "GABC123456789EXAMPLE";
  const mockHorizonUrl = "https://horizon-testnet.stellar.org";

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns default state when address is null or disabled", () => {
    const { result } = renderHook(() =>
      useBalanceHistory(null, mockHorizonUrl, false)
    );

    expect(result.current.balances).toEqual([]);
    expect(result.current.series).toEqual([]);
    expect(result.current.status).toBe("idle");
    expect(result.current.isUnfunded).toBe(false);
  });

  it("handles 404 account not found gracefully as unfunded account", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      status: 404,
      ok: false,
      json: async () => ({}),
    } as Response);

    const { result } = renderHook(() =>
      useBalanceHistory(mockAddress, mockHorizonUrl, true)
    );

    await waitFor(() => {
      expect(result.current.accountNotFound).toBe(true);
    });

    expect(result.current.balances).toEqual([]);
    expect(result.current.series).toEqual([]);
    expect(result.current.status).toBe("idle");
  });

  it("fetches balances and builds series when account exists", async () => {
    const mockAccountResponse = {
      balances: [
        { asset_type: "native", balance: "150.0000000" },
        { asset_type: "credit_alphanum4", asset_code: "USDC", asset_issuer: "GDCBA", balance: "25.0000000" },
      ],
    };

    const mockEffectsResponse = {
      _embedded: {
        records: [
          {
            type: "account_credited",
            asset_type: "native",
            amount: "50.0000000",
            created_at: new Date().toISOString(),
          },
        ],
      },
      _links: {},
    };

    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce({
        status: 200,
        ok: true,
        json: async () => mockAccountResponse,
      } as Response)
      .mockResolvedValueOnce({
        status: 200,
        ok: true,
        json: async () => mockEffectsResponse,
      } as Response);

    const { result } = renderHook(() =>
      useBalanceHistory(mockAddress, mockHorizonUrl, true)
    );

    await waitFor(() => {
      expect(result.current.status).toBe("idle");
      expect(result.current.balances.length).toBe(2);
    });

    expect(result.current.balances[0].balance).toBe("150.0000000");
    expect(result.current.series.length).toBe(30);
  });
});
