"use client";

import { useCallback, useEffect, useState } from "react";
import { useNetwork } from "./useNetwork";
import { useWallet } from "./useWallet";
import {
  findNetworkByFreighterName,
  findNetworkByPassphrase,
  type NetworkConfig,
} from "../lib/networks";

export interface NetworkMismatchState {
  /** True when the wallet is connected and its network does not match the active app network */
  isMismatched: boolean;
  /** Active app network configuration */
  appNetworkConfig: NetworkConfig;
  /** Wallet network configuration (if matched to a known network) */
  walletNetworkConfig: NetworkConfig | undefined;
  /** User-friendly label for the wallet's current network */
  walletNetworkLabel: string;
  /** User-friendly label for the app's current network */
  appNetworkLabel: string;
  /** Action to switch the app's network to match the connected wallet */
  switchToWalletNetwork: () => void;
}

/**
 * Reconciles the active app network choice against Freighter wallet's network.
 *
 * Compares `state.networkPassphrase` (and `state.network`) from `useWallet` against
 * the active `NetworkConfig` from `useNetwork` in a `useEffect`.
 */
export function useNetworkMismatch(): NetworkMismatchState {
  const { network: appNetworkConfig, setNetwork } = useNetwork();
  const wallet = useWallet();

  const [isMismatched, setIsMismatched] = useState(false);
  const [walletNetworkConfig, setWalletNetworkConfig] = useState<
    NetworkConfig | undefined
  >(undefined);
  const [walletNetworkLabel, setWalletNetworkLabel] = useState<string>("");

  useEffect(() => {
    // Only check mismatch if wallet is connected
    if (!wallet.isConnected) {
      setIsMismatched(false);
      setWalletNetworkConfig(undefined);
      setWalletNetworkLabel("");
      return;
    }

    const { networkPassphrase, network: walletNetworkName } = wallet;

    // Resolve wallet network config by passphrase first, then by name
    const matchedWalletConfig =
      findNetworkByPassphrase(networkPassphrase) ||
      findNetworkByFreighterName(walletNetworkName);

    setWalletNetworkConfig(matchedWalletConfig);

    const derivedLabel =
      matchedWalletConfig?.label ||
      (walletNetworkName
        ? walletNetworkName.charAt(0).toUpperCase() +
          walletNetworkName.slice(1).toLowerCase()
        : "Unknown");

    setWalletNetworkLabel(derivedLabel);

    // Determine mismatch by passphrase (most reliable), then by network name fallback
    if (networkPassphrase) {
      const match =
        networkPassphrase.trim() === appNetworkConfig.networkPassphrase.trim();
      setIsMismatched(!match);
    } else if (walletNetworkName) {
      const match =
        walletNetworkName.trim().toUpperCase() ===
        appNetworkConfig.freighterNetwork.trim().toUpperCase();
      setIsMismatched(!match);
    } else {
      // Wallet connected but no network info available — cannot determine mismatch
      setIsMismatched(false);
    }
    // We intentionally list individual wallet fields instead of the entire `wallet`
    // object, because useWallet returns a new object reference on every render.
    // Listing `wallet` directly would cause this effect to run on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    wallet.isConnected,
    wallet.networkPassphrase,
    wallet.network,
    appNetworkConfig.networkPassphrase,
    appNetworkConfig.freighterNetwork,
  ]);

  /**
   * Stable callback — wrapped in useCallback so it never goes stale when
   * passed down as a prop or held by a child component.
   */
  const switchToWalletNetwork = useCallback(() => {
    if (walletNetworkConfig) {
      setNetwork(walletNetworkConfig.id);
      return;
    }
    // Fallback: re-resolve by name if walletNetworkConfig hasn't been set yet
    if (wallet.network) {
      const matched = findNetworkByFreighterName(wallet.network);
      if (matched) {
        setNetwork(matched.id);
      }
    }
  }, [walletNetworkConfig, wallet.network, setNetwork]);

  return {
    isMismatched,
    appNetworkConfig,
    walletNetworkConfig,
    walletNetworkLabel,
    appNetworkLabel: appNetworkConfig.label,
    switchToWalletNetwork,
  };
}
