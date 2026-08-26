// @vitest-environment jsdom

import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useDemoModeGuard, DEMO_MODE_BLOCKED_MESSAGE } from "./useDemoModeGuard";
import { enableDemoMode } from "../lib/demoMode";

describe("useDemoModeGuard", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it("reports isDemoMode false and returns no disabledProps when demo mode is off", () => {
    const { result } = renderHook(() => useDemoModeGuard());

    expect(result.current.isDemoMode).toBe(false);
    expect(result.current.disabledProps).toEqual({});
  });

  it("reports isDemoMode true and returns disabled + title when demo mode is on", () => {
    enableDemoMode();
    const { result } = renderHook(() => useDemoModeGuard());

    expect(result.current.isDemoMode).toBe(true);
    expect(result.current.disabledProps).toEqual({
      disabled: true,
      title: DEMO_MODE_BLOCKED_MESSAGE,
    });
  });

  it("guard() calls the wrapped function when demo mode is off", () => {
    const { result } = renderHook(() => useDemoModeGuard());
    const fn = vi.fn();

    result.current.guard(fn)("arg1", 2);

    expect(fn).toHaveBeenCalledWith("arg1", 2);
  });

  it("guard() is a no-op when demo mode is on", () => {
    enableDemoMode();
    const { result } = renderHook(() => useDemoModeGuard());
    const fn = vi.fn();

    result.current.guard(fn)("arg1", 2);

    expect(fn).not.toHaveBeenCalled();
  });
});
