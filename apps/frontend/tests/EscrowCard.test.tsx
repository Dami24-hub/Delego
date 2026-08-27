import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { EscrowCard } from "../components/escrows/EscrowCard";
import { CurrencyProvider } from "../hooks/useCurrency";
import type { Escrow } from "@delegolabs/types";

function renderEscrowCard(escrow: Escrow) {
  return render(
    <CurrencyProvider>
      <EscrowCard escrow={escrow} />
    </CurrencyProvider>
  );
}

const fundedEscrow: Escrow = {
  escrowId: "42",
  buyer: "GBVNN…EXAMPLE…BUYER",
  seller: "GCSV4…EXAMPLE…SELLER",
  token: "CAS3J…TOKEN…ADDR",
  amount: "15000000000", // 1,500 XLM
  status: "Funded",
  orderId: "0a1b2c3d4e5f6789abcdef0123456789abcdef0123456789abcdef0123456789",
  createdAt: "2026-07-20T10:00:00.000Z",
  timeoutLedger: 5_500_000,
  currentLedger: 5_499_000,
};

const releasedEscrow: Escrow = {
  ...fundedEscrow,
  escrowId: "99",
  status: "Released",
  currentLedger: undefined,
};

const refundedEscrow: Escrow = {
  ...fundedEscrow,
  escrowId: "7",
  status: "Refunded",
  currentLedger: undefined,
};

const disputedEscrow: Escrow = {
  ...fundedEscrow,
  escrowId: "3",
  status: "Disputed",
  currentLedger: undefined,
};

describe("EscrowCard", () => {
  it("renders the escrow ID", () => {
    renderEscrowCard(fundedEscrow);
    expect(screen.getByText(/Escrow #42/)).toBeInTheDocument();
  });

  it("renders the formatted amount", () => {
    renderEscrowCard(fundedEscrow);
    expect(screen.getByTestId("escrow-amount")).toHaveTextContent(
      "1,500.00 XLM"
    );
  });

  it("renders the status badge with correct label", () => {
    renderEscrowCard(fundedEscrow);
    const badge = screen.getByTestId("escrow-status-badge");
    expect(badge).toHaveTextContent("Funded");
  });

  it("shows Released badge when status is Released", () => {
    renderEscrowCard(releasedEscrow);
    expect(screen.getByTestId("escrow-status-badge")).toHaveTextContent(
      "Released"
    );
  });

  it("shows Refunded badge when status is Refunded", () => {
    renderEscrowCard(refundedEscrow);
    expect(screen.getByTestId("escrow-status-badge")).toHaveTextContent(
      "Refunded"
    );
  });

  it("shows Disputed badge when status is Disputed", () => {
    renderEscrowCard(disputedEscrow);
    expect(screen.getByTestId("escrow-status-badge")).toHaveTextContent(
      "Disputed"
    );
  });

  it("renders buyer and seller addresses shortened", () => {
    renderEscrowCard(fundedEscrow);
    expect(screen.getByText(/GBVNN…/)).toBeInTheDocument();
    expect(screen.getByText(/GCSV4…/)).toBeInTheDocument();
  });

  it("renders timeout countdown for funded escrows", () => {
    renderEscrowCard(fundedEscrow);
    const countdown = screen.getByTestId("escrow-countdown");
    expect(countdown).toBeInTheDocument();
    // 1,000 ledgers × 5s ≈ 1h 23m
    expect(countdown.textContent).toMatch(/~1h 23m/);
  });

  it("shows urgent countdown when less than 1 hour remains", () => {
    const urgentEscrow: Escrow = {
      ...fundedEscrow,
      timeoutLedger: 5_500_000,
      currentLedger: 5_499_950, // 50 ledgers ≈ 4m 10s
    };
    renderEscrowCard(urgentEscrow);
    const countdown = screen.getByTestId("escrow-countdown");
    expect(countdown).toHaveTextContent("Expiring soon:");
    expect(countdown).toHaveTextContent("~4m");
  });

  it("does not render countdown for non-funded escrows", () => {
    renderEscrowCard(releasedEscrow);
    expect(screen.queryByTestId("escrow-countdown")).not.toBeInTheDocument();
  });
});
