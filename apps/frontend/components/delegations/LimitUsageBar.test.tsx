import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LimitUsageBar } from "./LimitUsageBar";

vi.mock("../../hooks/useCurrency", () => ({
  useCurrency: () => ({
    currencyId: "XLM",
    rate: { xlmUsdRate: 0.12 },
  }),
}));

describe("LimitUsageBar", () => {
  it("renders compact progressbar with calm percentage", () => {
    render(<LimitUsageBar spent={30n} cap={100n} density="compact" />);
    const bar = screen.getByRole("progressbar");
    expect(bar).toHaveAttribute("aria-valuenow", "30");
    expect(screen.getByText("Period Spending (30%)")).toBeInTheDocument();
  });

  it("renders expanded view with near-limit warning when usage > 90%", () => {
    render(<LimitUsageBar spent={95n} cap={100n} density="expanded" />);
    expect(screen.getByText("Spending Policy Headroom")).toBeInTheDocument();
    expect(screen.getByText("Near Spend Limit (95% Used)")).toBeInTheDocument();
  });

  it("renders spend ledger entries when provided in expanded view", () => {
    const ledger = [
      {
        id: "e-1",
        amount: 20000000n,
        merchant: "Grocery Store",
        timestamp: "2026-08-25T10:00:00Z",
      },
    ];
    render(
      <LimitUsageBar
        spent={20000000n}
        cap={100000000n}
        density="expanded"
        ledgerEntries={ledger}
      />
    );
    expect(screen.getByText("Recent Spend Ledger")).toBeInTheDocument();
    expect(screen.getByText("Grocery Store")).toBeInTheDocument();
  });
});
