import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  liquidityPoolFeeStroops,
  maxSourceAmount,
  priceImpactForRoute,
  strictReceiveQuery,
  stroopsToDecimal,
  toPathQuoteResponse,
  usePathPaymentQuote,
  PRICE_IMPACT_WARNING_PERCENT,
  type PathPaymentRoute,
} from "./usePathPaymentQuote";

describe("path payment quote math (#901)", () => {
  it("raises the source cap by the slippage tolerance", () => {
    expect(maxSourceAmount("10", 1)).toBe("10.1000000");
    expect(maxSourceAmount("10", 0.5)).toBe("10.0500000");
  });

  it("converts stroops to a decimal amount", () => {
    expect(stroopsToDecimal(15_000_000n)).toBe("1.5");
    expect(stroopsToDecimal(0)).toBe("0");
  });

  it("charges 30 bps per intermediate hop", () => {
    expect(liquidityPoolFeeStroops("10", 2)).toBe(String(Math.round(10 * 0.003 * 2 * 10_000_000)));
    expect(liquidityPoolFeeStroops("10", 0)).toBe("0");
  });

  it("picks the cheapest route and flags impact above 2.5%", () => {
    const quote = toPathQuoteResponse(
      [
        {
          sourceAsset: "XLM",
          destinationAsset: "USDC",
          sourceAmount: "20",
          destinationAmount: "10",
          path: ["EURC"],
        },
        {
          sourceAsset: "XLM",
          destinationAsset: "USDC",
          sourceAmount: "10",
          destinationAmount: "10",
          path: [],
        },
      ],
      0.5,
      1_000
    );
    expect(quote?.bestRouteIndex).toBe(1);
    expect(quote?.routes[1].sourceAmountMax).toBe("10.0500000");
    expect(quote?.expiresAt).toBe(31_000);

    const expensive = priceImpactForRoute(quote?.routes ?? [], 0);
    expect(expensive).toBeGreaterThan(PRICE_IMPACT_WARNING_PERCENT);
    expect(priceImpactForRoute(quote?.routes ?? [], 1)).toBe(0);
  });

  it("builds a strict-receive query for a credit destination", () => {
    const query = strictReceiveQuery({
      sourceAssetParam: "native",
      destinationAsset: "USDC",
      destinationIssuer: "GISSUER",
      destinationAmount: "5",
    });
    expect(query).toContain("source_assets=native");
    expect(query).toContain("destination_asset_code=USDC");
    expect(query).toContain("destination_asset_issuer=GISSUER");
    expect(query).toContain("destination_amount=5");
  });
});

describe("usePathPaymentQuote", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("loads Horizon strict-receive routes for the selected wallet asset", async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => ({
      ok: true,
      json: async () => ({
        _embedded: {
          records: [
            {
              source_asset_type: "native",
              source_amount: "12.5",
              destination_asset_type: "credit_alphanum4",
              destination_asset_code: "USDC",
              destination_asset_issuer: "GISSUER",
              destination_amount: "5",
              path: [
                { asset_type: "liquidity_pool_shares" },
                { asset_type: "credit_alphanum4", asset_code: "EURC" },
              ],
            },
          ],
        },
      }),
    }));
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() =>
      usePathPaymentQuote({
        horizonUrl: "https://horizon.test",
        sourceAssetParam: "native",
        destinationAsset: "USDC",
        destinationIssuer: "GISSUER",
        destinationAmount: "5",
        slippageTolerancePercent: 1,
      })
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("https://horizon.test/paths/strict-receive?"),
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    );
    const url = String(fetchMock.mock.calls[0][0]);
    expect(url).toContain("source_assets=native");
    const route: PathPaymentRoute | undefined = result.current.quote?.routes[0];
    expect(route?.path).toEqual(["AMM pool", "EURC"]);
    expect(route?.sourceAmountMax).toBe("12.6250000");
    expect(result.current.quote?.bestRouteIndex).toBe(0);
    expect(result.current.priceImpactPercent).toBe(0.6);
  });
});
