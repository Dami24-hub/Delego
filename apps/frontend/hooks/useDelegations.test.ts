import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useDelegations } from "./useDelegations";

const mockGetDelegations = vi.fn();
vi.mock("../lib/api", () => ({
  api: { getDelegations: (...args: unknown[]) => mockGetDelegations(...args) },
}));

describe("useDelegations", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockGetDelegations.mockReset();
  });

  it("returns valid delegation array", async () => {
    const validData = [
      {
        id: "1",
        userId: "user-1",
        agentId: "agent-1",
        status: "active",
        policy: {
          maxPerTransaction: 1000n,
          maxTotal: 5000n,
          allowedMerchants: [],
          expiresAt: null,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    mockGetDelegations.mockResolvedValue({ data: validData, error: null });

    const { result } = renderHook(() => useDelegations());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.delegations).toEqual(validData);
    expect(result.current.error).toBeNull();
  });

  it("sets error when data is null", async () => {
    mockGetDelegations.mockResolvedValue({ data: null, error: null });

    const { result } = renderHook(() => useDelegations());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe("Invalid response format");
  });

  it("sets error when data is an object instead of array", async () => {
    mockGetDelegations.mockResolvedValue({
      data: { id: "1" },
      error: null,
    });

    const { result } = renderHook(() => useDelegations());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe("Invalid response format");
  });

  it("sets error when array items are missing required fields", async () => {
    mockGetDelegations.mockResolvedValue({
      data: [{ id: "1", userId: "u1" }],
      error: null,
    });

    const { result } = renderHook(() => useDelegations());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe("Invalid response format");
  });

  it("sets error when API returns error", async () => {
    mockGetDelegations.mockResolvedValue({
      data: null,
      error: { code: "INTERNAL", message: "Server error" },
    });

    const { result } = renderHook(() => useDelegations());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe("Server error");
  });

  it("sets error on fetch failure", async () => {
    mockGetDelegations.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useDelegations());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe("Failed to fetch delegations");
  });
});
