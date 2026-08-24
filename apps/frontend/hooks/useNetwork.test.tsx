import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import type { ReactNode } from "react";
import { NetworkProvider, useNetwork } from "./useNetwork";
import { NETWORK_STORAGE_KEY } from "../lib/networks";

function wrapper({ children }: { children: ReactNode }) {
  return <NetworkProvider>{children}</NetworkProvider>;
}

describe("useNetwork", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("defaults to testnet and hydrates from the client", async () => {
    const { result } = renderHook(() => useNetwork(), { wrapper });

    expect(result.current.networkId).toBe("testnet");

    await waitFor(() => expect(result.current.hydrated).toBe(true));
    expect(result.current.networkId).toBe("testnet");
  });

  it("hydrates the persisted network from localStorage", async () => {
    window.localStorage.setItem(NETWORK_STORAGE_KEY, "mainnet");

    const { result } = renderHook(() => useNetwork(), { wrapper });

    await waitFor(() => expect(result.current.hydrated).toBe(true));
    expect(result.current.networkId).toBe("mainnet");
    expect(result.current.network.id).toBe("mainnet");
  });

  it("ignores an invalid stored value and keeps the default", async () => {
    window.localStorage.setItem(NETWORK_STORAGE_KEY, "not-a-network");

    const { result } = renderHook(() => useNetwork(), { wrapper });

    await waitFor(() => expect(result.current.hydrated).toBe(true));
    expect(result.current.networkId).toBe("testnet");
  });

  it("setNetwork switches the active network and persists it", async () => {
    const { result } = renderHook(() => useNetwork(), { wrapper });
    await waitFor(() => expect(result.current.hydrated).toBe(true));

    act(() => {
      result.current.setNetwork("mainnet");
    });

    expect(result.current.networkId).toBe("mainnet");
    expect(result.current.network.isLive).toBe(true);
    expect(window.localStorage.getItem(NETWORK_STORAGE_KEY)).toBe("mainnet");
  });

  it("exposes all configured networks", async () => {
    const { result } = renderHook(() => useNetwork(), { wrapper });
    await waitFor(() => expect(result.current.hydrated).toBe(true));

    expect(result.current.networks.map((n) => n.id).sort()).toEqual([
      "mainnet",
      "testnet",
    ]);
  });

  it("syncs across tabs via the storage event", async () => {
    const { result } = renderHook(() => useNetwork(), { wrapper });
    await waitFor(() => expect(result.current.hydrated).toBe(true));

    act(() => {
      window.localStorage.setItem(NETWORK_STORAGE_KEY, "mainnet");
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: NETWORK_STORAGE_KEY,
          newValue: "mainnet",
        })
      );
    });

    expect(result.current.networkId).toBe("mainnet");
  });

  it("ignores storage events for unrelated keys", async () => {
    const { result } = renderHook(() => useNetwork(), { wrapper });
    await waitFor(() => expect(result.current.hydrated).toBe(true));

    act(() => {
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: "some_other_key",
          newValue: "mainnet",
        })
      );
    });

    expect(result.current.networkId).toBe("testnet");
  });

  it("ignores storage events with an invalid network value", async () => {
    const { result } = renderHook(() => useNetwork(), { wrapper });
    await waitFor(() => expect(result.current.hydrated).toBe(true));

    act(() => {
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: NETWORK_STORAGE_KEY,
          newValue: "bogus",
        })
      );
    });

    expect(result.current.networkId).toBe("testnet");
  });

  it("throws when used outside a NetworkProvider", () => {
    expect(() => renderHook(() => useNetwork())).toThrow(
      "useNetwork must be used within a NetworkProvider"
    );
  });
});
