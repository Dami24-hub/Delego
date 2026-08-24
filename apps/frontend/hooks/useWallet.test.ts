import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useWallet } from "./useWallet";

const mockIsConnected = vi.fn();
const mockIsAllowed = vi.fn();
const mockGetAddress = vi.fn();
const mockGetNetwork = vi.fn();
const mockRequestAccess = vi.fn();

vi.mock("@stellar/freighter-api", () => ({
  isConnected: (...args: unknown[]) => mockIsConnected(...args),
  isAllowed: (...args: unknown[]) => mockIsAllowed(...args),
  getAddress: (...args: unknown[]) => mockGetAddress(...args),
  getNetwork: (...args: unknown[]) => mockGetNetwork(...args),
  requestAccess: (...args: unknown[]) => mockRequestAccess(...args),
}));

describe("useWallet", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockIsConnected.mockReset();
    mockIsAllowed.mockReset();
    mockGetAddress.mockReset();
    mockGetNetwork.mockReset();
    mockRequestAccess.mockReset();
  });

  it("reports unavailable when the extension is not installed", async () => {
    mockIsConnected.mockResolvedValue({ isConnected: false });

    const { result } = renderHook(() => useWallet());

    await waitFor(() => expect(result.current.status).toBe("unavailable"));
    expect(result.current.isConnected).toBe(false);
    expect(result.current.address).toBeNull();
  });

  it("reports unavailable when isConnected errors", async () => {
    mockIsConnected.mockResolvedValue({
      isConnected: false,
      error: { message: "extension error" },
    });

    const { result } = renderHook(() => useWallet());

    await waitFor(() => expect(result.current.status).toBe("unavailable"));
  });

  it("reports disconnected when the extension is present but not allowed", async () => {
    mockIsConnected.mockResolvedValue({ isConnected: true });
    mockIsAllowed.mockResolvedValue({ isAllowed: false });

    const { result } = renderHook(() => useWallet());

    await waitFor(() => expect(result.current.status).toBe("disconnected"));
    expect(result.current.address).toBeNull();
  });

  it("reports error when the address cannot be read", async () => {
    mockIsConnected.mockResolvedValue({ isConnected: true });
    mockIsAllowed.mockResolvedValue({ isAllowed: true });
    mockGetAddress.mockResolvedValue({
      address: null,
      error: { message: "no address" },
    });

    const { result } = renderHook(() => useWallet());

    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(result.current.error).toBe("no address");
  });

  it("connects successfully and reports network details", async () => {
    mockIsConnected.mockResolvedValue({ isConnected: true });
    mockIsAllowed.mockResolvedValue({ isAllowed: true });
    mockGetAddress.mockResolvedValue({ address: "GABC123" });
    mockGetNetwork.mockResolvedValue({
      network: "TESTNET",
      networkPassphrase: "Test SDF Network ; September 2015",
    });

    const { result } = renderHook(() => useWallet());

    await waitFor(() => expect(result.current.status).toBe("connected"));
    expect(result.current.address).toBe("GABC123");
    expect(result.current.network).toBe("TESTNET");
    expect(result.current.isConnected).toBe(true);
  });

  it("falls back to null network fields when getNetwork errors", async () => {
    mockIsConnected.mockResolvedValue({ isConnected: true });
    mockIsAllowed.mockResolvedValue({ isAllowed: true });
    mockGetAddress.mockResolvedValue({ address: "GABC123" });
    mockGetNetwork.mockResolvedValue({ error: { message: "network error" } });

    const { result } = renderHook(() => useWallet());

    await waitFor(() => expect(result.current.status).toBe("connected"));
    expect(result.current.network).toBeNull();
    expect(result.current.networkPassphrase).toBeNull();
  });

  it("marks the wallet unavailable when the module import throws", async () => {
    mockIsConnected.mockRejectedValue(new Error("import failed"));

    const { result } = renderHook(() => useWallet());

    await waitFor(() => expect(result.current.status).toBe("unavailable"));
    expect(result.current.error).toBe("import failed");
  });

  describe("connect", () => {
    it("requests access and transitions to connected", async () => {
      mockIsConnected.mockResolvedValue({ isConnected: false });
      const { result } = renderHook(() => useWallet());
      await waitFor(() => expect(result.current.status).toBe("unavailable"));

      mockRequestAccess.mockResolvedValue({ address: "GXYZ789" });
      mockGetNetwork.mockResolvedValue({
        network: "PUBLIC",
        networkPassphrase: "Public Global Stellar Network ; September 2015",
      });

      await act(async () => {
        await result.current.connect();
      });

      expect(result.current.status).toBe("connected");
      expect(result.current.address).toBe("GXYZ789");
    });

    it("reports an error when the user denies access", async () => {
      mockIsConnected.mockResolvedValue({ isConnected: false });
      const { result } = renderHook(() => useWallet());
      await waitFor(() => expect(result.current.status).toBe("unavailable"));

      mockRequestAccess.mockResolvedValue({
        address: null,
        error: { message: "User declined access" },
      });

      await act(async () => {
        await result.current.connect();
      });

      expect(result.current.status).toBe("error");
      expect(result.current.error).toBe("User declined access");
    });

    it("marks unavailable when requestAccess throws", async () => {
      mockIsConnected.mockResolvedValue({ isConnected: false });
      const { result } = renderHook(() => useWallet());
      await waitFor(() => expect(result.current.status).toBe("unavailable"));

      mockRequestAccess.mockRejectedValue(new Error("no extension"));

      await act(async () => {
        await result.current.connect();
      });

      expect(result.current.status).toBe("unavailable");
      expect(result.current.error).toBe("no extension");
    });
  });

  describe("disconnect", () => {
    it("resets state to disconnected", async () => {
      mockIsConnected.mockResolvedValue({ isConnected: true });
      mockIsAllowed.mockResolvedValue({ isAllowed: true });
      mockGetAddress.mockResolvedValue({ address: "GABC123" });
      mockGetNetwork.mockResolvedValue({
        network: "TESTNET",
        networkPassphrase: "Test SDF Network ; September 2015",
      });

      const { result } = renderHook(() => useWallet());
      await waitFor(() => expect(result.current.status).toBe("connected"));

      act(() => {
        result.current.disconnect();
      });

      expect(result.current.status).toBe("disconnected");
      expect(result.current.address).toBeNull();
      expect(result.current.isConnected).toBe(false);
    });
  });

  describe("refresh", () => {
    it("re-runs the connection check on demand", async () => {
      mockIsConnected.mockResolvedValue({ isConnected: false });
      const { result } = renderHook(() => useWallet());
      await waitFor(() => expect(result.current.status).toBe("unavailable"));

      mockIsConnected.mockResolvedValue({ isConnected: true });
      mockIsAllowed.mockResolvedValue({ isAllowed: true });
      mockGetAddress.mockResolvedValue({ address: "GNEW111" });
      mockGetNetwork.mockResolvedValue({
        network: "TESTNET",
        networkPassphrase: "Test SDF Network ; September 2015",
      });

      await act(async () => {
        await result.current.refresh();
      });

      expect(result.current.status).toBe("connected");
      expect(result.current.address).toBe("GNEW111");
    });
  });
});
