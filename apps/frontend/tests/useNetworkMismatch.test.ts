import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useNetworkMismatch } from "../hooks/useNetworkMismatch";
import { NETWORKS } from "../lib/networks";

// Default mock values for useNetwork and useWallet
let mockAppNetwork = NETWORKS.testnet;
let mockSetNetwork = vi.fn();

let mockWalletState = {
  isConnected: true,
  status: "connected",
  address: "GABC123456789",
  network: "PUBLIC",
  networkPassphrase: NETWORKS.mainnet.networkPassphrase,
  error: null,
};

vi.mock("../hooks/useNetwork", () => ({
  useNetwork: () => ({
    networkId: mockAppNetwork.id,
    network: mockAppNetwork,
    networks: Object.values(NETWORKS),
    setNetwork: mockSetNetwork,
    hydrated: true,
  }),
}));

vi.mock("../hooks/useWallet", () => ({
  useWallet: () => mockWalletState,
}));

describe("useNetworkMismatch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAppNetwork = NETWORKS.testnet;
    mockSetNetwork = vi.fn((newId) => {
      if (NETWORKS[newId as keyof typeof NETWORKS]) {
        mockAppNetwork = NETWORKS[newId as keyof typeof NETWORKS];
      }
    });
    mockWalletState = {
      isConnected: true,
      status: "connected",
      address: "GABC123456789",
      network: "PUBLIC",
      networkPassphrase: NETWORKS.mainnet.networkPassphrase,
      error: null,
    };
  });

  it("detects mismatch when wallet is on Mainnet but app is on Testnet", () => {
    mockAppNetwork = NETWORKS.testnet;
    mockWalletState.networkPassphrase = NETWORKS.mainnet.networkPassphrase;
    mockWalletState.network = "PUBLIC";

    const { result } = renderHook(() => useNetworkMismatch());

    expect(result.current.isMismatched).toBe(true);
    expect(result.current.walletNetworkLabel).toBe("Mainnet");
    expect(result.current.appNetworkLabel).toBe("Testnet");
  });

  it("detects mismatch when wallet is on Testnet but app is on Mainnet", () => {
    mockAppNetwork = NETWORKS.mainnet;
    mockWalletState.networkPassphrase = NETWORKS.testnet.networkPassphrase;
    mockWalletState.network = "TESTNET";

    const { result } = renderHook(() => useNetworkMismatch());

    expect(result.current.isMismatched).toBe(true);
    expect(result.current.walletNetworkLabel).toBe("Testnet");
    expect(result.current.appNetworkLabel).toBe("Mainnet");
  });

  it("reports no mismatch when wallet and app are both on Testnet", () => {
    mockAppNetwork = NETWORKS.testnet;
    mockWalletState.networkPassphrase = NETWORKS.testnet.networkPassphrase;
    mockWalletState.network = "TESTNET";

    const { result } = renderHook(() => useNetworkMismatch());

    expect(result.current.isMismatched).toBe(false);
  });

  it("reports no mismatch when wallet and app are both on Mainnet", () => {
    mockAppNetwork = NETWORKS.mainnet;
    mockWalletState.networkPassphrase = NETWORKS.mainnet.networkPassphrase;
    mockWalletState.network = "PUBLIC";

    const { result } = renderHook(() => useNetworkMismatch());

    expect(result.current.isMismatched).toBe(false);
  });

  it("reports no mismatch when wallet is disconnected", () => {
    mockWalletState.isConnected = false;
    mockWalletState.status = "disconnected";

    const { result } = renderHook(() => useNetworkMismatch());

    expect(result.current.isMismatched).toBe(false);
  });

  it("switches app network to match wallet when switchToWalletNetwork is called", () => {
    mockAppNetwork = NETWORKS.testnet;
    mockWalletState.networkPassphrase = NETWORKS.mainnet.networkPassphrase;
    mockWalletState.network = "PUBLIC";

    const { result, rerender } = renderHook(() => useNetworkMismatch());

    expect(result.current.isMismatched).toBe(true);

    act(() => {
      result.current.switchToWalletNetwork();
    });

    expect(mockSetNetwork).toHaveBeenCalledWith("mainnet");

    // Rerender after network updated
    rerender();
    expect(result.current.isMismatched).toBe(false);
  });
});
