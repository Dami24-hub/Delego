import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import type { ReactNode } from "react";
import { CurrencyProvider, useCurrency } from "./useCurrency";
import { CURRENCY_STORAGE_KEY } from "../lib/currencies";

function wrapper({ children }: { children: ReactNode }) {
  return <CurrencyProvider>{children}</CurrencyProvider>;
}

describe("useCurrency", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.unstubAllGlobals();
  });

  it("defaults to XLM and hydrates from the client", async () => {
    const { result } = renderHook(() => useCurrency(), { wrapper });

    expect(result.current.currencyId).toBe("XLM");

    await waitFor(() => expect(result.current.hydrated).toBe(true));
    expect(result.current.currencyId).toBe("XLM");
  });

  it("hydrates the persisted currency from localStorage", async () => {
    window.localStorage.setItem(CURRENCY_STORAGE_KEY, "USD");

    const { result } = renderHook(() => useCurrency(), { wrapper });

    await waitFor(() => expect(result.current.hydrated).toBe(true));
    expect(result.current.currencyId).toBe("USD");
  });

  it("ignores an invalid stored value and keeps the default", async () => {
    window.localStorage.setItem(CURRENCY_STORAGE_KEY, "not-a-currency");

    const { result } = renderHook(() => useCurrency(), { wrapper });

    await waitFor(() => expect(result.current.hydrated).toBe(true));
    expect(result.current.currencyId).toBe("XLM");
  });

  it("setCurrency switches the active currency and persists it", async () => {
    const { result } = renderHook(() => useCurrency(), { wrapper });
    await waitFor(() => expect(result.current.hydrated).toBe(true));

    act(() => {
      result.current.setCurrency("USDC_ESTIMATE");
    });

    expect(result.current.currencyId).toBe("USDC_ESTIMATE");
    expect(window.localStorage.getItem(CURRENCY_STORAGE_KEY)).toBe(
      "USDC_ESTIMATE"
    );
  });

  it("exposes all configured currencies", async () => {
    const { result } = renderHook(() => useCurrency(), { wrapper });
    await waitFor(() => expect(result.current.hydrated).toBe(true));

    expect(result.current.currencies.map((c) => c.id)).toEqual([
      "XLM",
      "USDC_ESTIMATE",
      "USD",
    ]);
  });

  it("does not fetch a rate while in XLM mode", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useCurrency(), { wrapper });
    await waitFor(() => expect(result.current.hydrated).toBe(true));

    expect(result.current.rate).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("fetches and reports a rate when switching to an estimate mode", async () => {
    const { result } = renderHook(() => useCurrency(), { wrapper });
    await waitFor(() => expect(result.current.hydrated).toBe(true));

    act(() => {
      result.current.setCurrency("USD");
    });

    await waitFor(() => expect(result.current.rate).not.toBeNull());
    expect(result.current.rate?.isFallback).toBe(true);
    expect(result.current.rateIsStale).toBe(true);
  });

  it("throws when used outside a CurrencyProvider", () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    expect(() => renderHook(() => useCurrency())).toThrow(
      "useCurrency must be used within a CurrencyProvider"
    );
    consoleError.mockRestore();
  });
});
