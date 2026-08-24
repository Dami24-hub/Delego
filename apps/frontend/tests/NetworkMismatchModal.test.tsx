import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { NetworkMismatchModal } from "../components/network/NetworkMismatchModal";
import { NetworkProvider } from "../hooks/useNetwork";
import type { ReactNode } from "react";

function wrapper({ children }: { children: ReactNode }) {
  return <NetworkProvider>{children}</NetworkProvider>;
}

describe("NetworkMismatchModal", () => {
  it("does not render when there is no network mismatch", () => {
    render(<NetworkMismatchModal isMismatched={false} />, { wrapper });

    expect(screen.queryByTestId("network-mismatch-modal")).not.toBeInTheDocument();
  });

  it("renders blocking modal when wallet is on Mainnet but app is on Testnet", () => {
    render(
      <NetworkMismatchModal
        isMismatched={true}
        walletNetworkLabel="Mainnet"
        appNetworkLabel="Testnet"
      />,
      { wrapper }
    );

    expect(screen.getByTestId("network-mismatch-modal")).toBeInTheDocument();
    expect(screen.getByTestId("network-mismatch-message")).toHaveTextContent(
      "Your wallet is on Mainnet but the app is on Testnet"
    );
  });

  it("renders blocking modal when wallet is on Testnet but app is on Mainnet", () => {
    render(
      <NetworkMismatchModal
        isMismatched={true}
        walletNetworkLabel="Testnet"
        appNetworkLabel="Mainnet"
      />,
      { wrapper }
    );

    expect(screen.getByTestId("network-mismatch-modal")).toBeInTheDocument();
    expect(screen.getByTestId("network-mismatch-message")).toHaveTextContent(
      "Your wallet is on Testnet but the app is on Mainnet"
    );
  });

  it("triggers app network switch when 'Switch app network' button is clicked", () => {
    const handleSwitch = vi.fn();
    render(
      <NetworkMismatchModal
        isMismatched={true}
        walletNetworkLabel="Mainnet"
        appNetworkLabel="Testnet"
        onSwitchAppNetwork={handleSwitch}
      />,
      { wrapper }
    );

    const switchBtn = screen.getByTestId("switch-app-network-btn");
    expect(switchBtn).toHaveTextContent("Switch app network to Mainnet");

    fireEvent.click(switchBtn);
    expect(handleSwitch).toHaveBeenCalledTimes(1);
  });

  it("toggles step-by-step Freighter extension instructions", () => {
    render(
      <NetworkMismatchModal
        isMismatched={true}
        walletNetworkLabel="Mainnet"
        appNetworkLabel="Testnet"
      />,
      { wrapper }
    );

    expect(screen.queryByTestId("freighter-instructions")).not.toBeInTheDocument();

    const toggleBtn = screen.getByTestId("toggle-instructions-btn");
    fireEvent.click(toggleBtn);

    expect(screen.getByTestId("freighter-instructions")).toBeInTheDocument();
    expect(screen.getByTestId("freighter-instructions")).toHaveTextContent(
      "How to switch networks in Freighter"
    );

    fireEvent.click(toggleBtn);
    expect(screen.queryByTestId("freighter-instructions")).not.toBeInTheDocument();
  });
});
