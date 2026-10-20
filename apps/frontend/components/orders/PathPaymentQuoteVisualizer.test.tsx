import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  PathPaymentQuoteVisualizer,
  walletSourceAssets,
  type WalletSourceAsset,
} from "./PathPaymentQuoteVisualizer";
import type { PathQuoteResponse } from "../../hooks/usePathPaymentQuote";

const assets: WalletSourceAsset[] = [
  { code: "XLM", param: "native", balance: "25" },
  { code: "USDC", param: "USDC:GISSUER", issuer: "GISSUER", balance: "40" },
];

const quote: PathQuoteResponse = {
  bestRouteIndex: 0,
  expiresAt: Date.now() + 30_000,
  routes: [
    {
      sourceAsset: "XLM",
      destinationAsset: "USDC",
      sourceAmountMax: "20.1000000",
      destinationAmount: "10",
      path: ["EURC"],
      estimatedSlippagePercent: 0.5,
      liquidityPoolFeeStroops: "300000",
    },
    {
      sourceAsset: "XLM",
      destinationAsset: "USDC",
      sourceAmountMax: "10.0500000",
      destinationAmount: "10",
      path: [],
      estimatedSlippagePercent: 0.5,
      liquidityPoolFeeStroops: "0",
    },
  ],
};

describe("PathPaymentQuoteVisualizer (#901)", () => {
  it("lists wallet assets, hop breakdown, slippage, and a price-impact warning", async () => {
    const user = userEvent.setup();
    const onSelectAsset = vi.fn();
    const onSlippageChange = vi.fn();

    render(
      <PathPaymentQuoteVisualizer
        destinationAsset="USDC"
        destinationAmount="10"
        sourceAssets={assets}
        selectedParam="native"
        onSelectAsset={onSelectAsset}
        slippageTolerancePercent={0.5}
        onSlippageChange={onSlippageChange}
        quote={quote}
      />
    );

    expect(screen.getByTestId("path-payment-source-max")).toHaveTextContent("20.1000000 XLM");
    expect(screen.getByTestId("path-payment-hops")).toHaveTextContent("AMM pool · EURC");
    expect(screen.getByTestId("path-payment-impact-warning")).toHaveTextContent("2.5%");

    await user.click(screen.getByRole("button", { name: "1%" }));
    expect(onSlippageChange).toHaveBeenCalledWith(1);

    await user.click(screen.getByRole("button", { name: "Custom" }));
    fireEvent.change(screen.getByTestId("path-payment-slippage-custom"), {
      target: { value: "1.2" },
    });
    expect(onSlippageChange).toHaveBeenCalledWith(1.2);

    await user.selectOptions(screen.getByTestId("path-payment-source-asset"), "USDC:GISSUER");
    expect(onSelectAsset).toHaveBeenCalledWith("USDC:GISSUER");

    await user.click(screen.getByRole("button", { name: "AMM pool · EURC" }));
    expect(screen.getByRole("button", { name: "AMM pool · EURC" })).toHaveAttribute("aria-pressed", "true");
  });
});

describe("walletSourceAssets", () => {
  it("keeps native and issued balances the buyer can spend", () => {
    expect(
      walletSourceAssets([
        { asset_type: "native", balance: "3" },
        { asset_type: "credit_alphanum4", asset_code: "USDC", asset_issuer: "GABC", balance: "8" },
        { asset_type: "credit_alphanum4", asset_code: "USD", balance: "1" },
      ])
    ).toEqual([
      { code: "XLM", param: "native", balance: "3" },
      { code: "USDC", issuer: "GABC", param: "USDC:GABC", balance: "8" },
    ]);
  });
});
