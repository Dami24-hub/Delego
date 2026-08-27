import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useOsNotifications } from "./useOsNotifications";

class MockNotification {
  static permission: NotificationPermission = "default";
  static requestPermission = vi.fn<() => Promise<NotificationPermission>>();
  onclick: (() => void) | null = null;
  close = vi.fn();
  constructor(
    public title: string,
    public options?: NotificationOptions
  ) {}
}

describe("useOsNotifications", () => {
  beforeEach(() => {
    localStorage.clear();
    MockNotification.permission = "default";
    MockNotification.requestPermission = vi.fn().mockResolvedValue("granted");
    vi.stubGlobal("Notification", MockNotification);
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: true,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("reports supported when Notification exists on window", () => {
    const { result } = renderHook(() => useOsNotifications());
    expect(result.current.supported).toBe(true);
  });

  it("starts disabled (kill switch off) until the user opts in", () => {
    const { result } = renderHook(() => useOsNotifications());
    expect(result.current.enabled).toBe(false);
  });

  it("requestPermission prompts the browser and updates permission state", async () => {
    const { result } = renderHook(() => useOsNotifications());
    await act(async () => {
      await result.current.requestPermission();
    });
    expect(MockNotification.requestPermission).toHaveBeenCalledTimes(1);
    expect(result.current.permission).toBe("granted");
  });

  it("setEnabled persists across remounts (localStorage-backed kill switch)", () => {
    const { result, unmount } = renderHook(() => useOsNotifications());
    act(() => result.current.setEnabled(true));
    expect(result.current.enabled).toBe(true);
    unmount();

    const { result: result2 } = renderHook(() => useOsNotifications());
    expect(result2.current.enabled).toBe(true);
  });

  it("does not fire when the kill switch is off, even if permission is granted", async () => {
    const { result } = renderHook(() => useOsNotifications());
    await act(async () => {
      await result.current.requestPermission();
    });
    const fired = result.current.notify({ title: "New approval" });
    expect(fired).toBe(false);
  });

  it("does not fire when permission is denied, even if the kill switch is on", async () => {
    MockNotification.permission = "denied";
    MockNotification.requestPermission = vi.fn().mockResolvedValue("denied");
    const { result } = renderHook(() => useOsNotifications());
    act(() => result.current.setEnabled(true));
    await act(async () => {
      await result.current.requestPermission();
    });
    expect(result.current.notify({ title: "New approval" })).toBe(false);
  });

  it("does not fire when the tab is visible (foreground)", async () => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: false,
    });
    const { result } = renderHook(() => useOsNotifications());
    act(() => result.current.setEnabled(true));
    await act(async () => {
      await result.current.requestPermission();
    });
    expect(result.current.notify({ title: "New approval" })).toBe(false);
  });

  it("fires exactly once when supported, granted, enabled, and the tab is hidden", async () => {
    const { result } = renderHook(() => useOsNotifications());
    act(() => result.current.setEnabled(true));
    await act(async () => {
      await result.current.requestPermission();
    });
    expect(
      result.current.notify({ title: "New approval", tag: "order-1" })
    ).toBe(true);
  });
});
