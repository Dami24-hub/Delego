import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useApprovalHotkeys } from "./useApprovalHotkeys";

function fireKey(
  key: string,
  opts: Partial<KeyboardEventInit> = {},
  target: EventTarget = document
) {
  const event = new KeyboardEvent("keydown", {
    key,
    bubbles: true,
    cancelable: true,
    ...opts,
  });
  target.dispatchEvent(event);
}

describe("useApprovalHotkeys", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts focused on the first item", () => {
    const { result } = renderHook(() =>
      useApprovalHotkeys({
        itemIds: ["a", "b", "c"],
        onApprove: vi.fn(),
        onReject: vi.fn(),
        onOpenDrawer: vi.fn(),
      })
    );
    expect(result.current.focusedId).toBe("a");
  });

  it("j moves focus down, k moves focus up, clamped at the ends", () => {
    const { result } = renderHook(() =>
      useApprovalHotkeys({
        itemIds: ["a", "b", "c"],
        onApprove: vi.fn(),
        onReject: vi.fn(),
        onOpenDrawer: vi.fn(),
      })
    );

    act(() => fireKey("j"));
    expect(result.current.focusedId).toBe("b");
    act(() => fireKey("j"));
    expect(result.current.focusedId).toBe("c");
    act(() => fireKey("j")); // already at the end
    expect(result.current.focusedId).toBe("c");

    act(() => fireKey("k"));
    expect(result.current.focusedId).toBe("b");
    act(() => fireKey("k"));
    expect(result.current.focusedId).toBe("a");
    act(() => fireKey("k")); // already at the start
    expect(result.current.focusedId).toBe("a");
  });

  it("Enter opens the drawer for the focused row", () => {
    const onOpenDrawer = vi.fn();
    renderHook(() =>
      useApprovalHotkeys({
        itemIds: ["a", "b"],
        onApprove: vi.fn(),
        onReject: vi.fn(),
        onOpenDrawer,
      })
    );
    act(() => fireKey("Enter"));
    expect(onOpenDrawer).toHaveBeenCalledWith("a");
  });

  it("a approves the focused row and offers an undo that reverses via reject", () => {
    const onApprove = vi.fn();
    const onReject = vi.fn();
    const { result } = renderHook(() =>
      useApprovalHotkeys({
        itemIds: ["a"],
        onApprove,
        onReject,
        onOpenDrawer: vi.fn(),
      })
    );

    act(() => fireKey("a"));
    expect(onApprove).toHaveBeenCalledWith("a");
    expect(result.current.undoAction?.message).toBe("Approved order a");

    act(() => result.current.undoAction?.undo());
    expect(onReject).toHaveBeenCalledWith("a");
  });

  it("r rejects the focused row and offers an undo that reverses via approve", () => {
    const onApprove = vi.fn();
    const onReject = vi.fn();
    const { result } = renderHook(() =>
      useApprovalHotkeys({
        itemIds: ["a"],
        onApprove,
        onReject,
        onOpenDrawer: vi.fn(),
      })
    );

    act(() => fireKey("r"));
    expect(onReject).toHaveBeenCalledWith("a");
    expect(result.current.undoAction?.message).toBe("Rejected order a");

    act(() => result.current.undoAction?.undo());
    expect(onApprove).toHaveBeenCalledWith("a");
  });

  it("the undo option expires after the undo window", () => {
    const { result } = renderHook(() =>
      useApprovalHotkeys({
        itemIds: ["a"],
        onApprove: vi.fn(),
        onReject: vi.fn(),
        onOpenDrawer: vi.fn(),
        undoWindowMs: 5000,
      })
    );
    act(() => fireKey("a"));
    expect(result.current.undoAction).not.toBeNull();

    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(result.current.undoAction).toBeNull();
  });

  it("? toggles the cheat sheet, Escape closes it", () => {
    const { result } = renderHook(() =>
      useApprovalHotkeys({
        itemIds: ["a"],
        onApprove: vi.fn(),
        onReject: vi.fn(),
        onOpenDrawer: vi.fn(),
      })
    );
    expect(result.current.showCheatSheet).toBe(false);
    act(() => fireKey("?"));
    expect(result.current.showCheatSheet).toBe(true);
    act(() => fireKey("Escape"));
    expect(result.current.showCheatSheet).toBe(false);
  });

  it("ignores hotkeys while typing in an input", () => {
    const onApprove = vi.fn();
    renderHook(() =>
      useApprovalHotkeys({
        itemIds: ["a"],
        onApprove,
        onReject: vi.fn(),
        onOpenDrawer: vi.fn(),
      })
    );
    const input = document.createElement("input");
    document.body.appendChild(input);
    act(() => fireKey("a", {}, input));
    expect(onApprove).not.toHaveBeenCalled();
    document.body.removeChild(input);
  });

  it("never fires on Cmd/Ctrl/Alt combos, to avoid shadowing browser shortcuts", () => {
    const onApprove = vi.fn();
    renderHook(() =>
      useApprovalHotkeys({
        itemIds: ["a"],
        onApprove,
        onReject: vi.fn(),
        onOpenDrawer: vi.fn(),
      })
    );
    act(() => fireKey("a", { ctrlKey: true }));
    act(() => fireKey("a", { metaKey: true }));
    act(() => fireKey("a", { altKey: true }));
    expect(onApprove).not.toHaveBeenCalled();
  });

  it("does nothing when disabled", () => {
    const onApprove = vi.fn();
    renderHook(() =>
      useApprovalHotkeys({
        itemIds: ["a"],
        onApprove,
        onReject: vi.fn(),
        onOpenDrawer: vi.fn(),
        disabled: true,
      })
    );
    act(() => fireKey("a"));
    expect(onApprove).not.toHaveBeenCalled();
  });

  it("re-focuses the first remaining item when the focused row leaves the queue", () => {
    const { result, rerender } = renderHook(
      ({ itemIds }) =>
        useApprovalHotkeys({
          itemIds,
          onApprove: vi.fn(),
          onReject: vi.fn(),
          onOpenDrawer: vi.fn(),
        }),
      { initialProps: { itemIds: ["a", "b", "c"] } }
    );
    act(() => fireKey("j")); // focus "b"
    expect(result.current.focusedId).toBe("b");

    rerender({ itemIds: ["a", "c"] }); // "b" was acted on and left the queue
    expect(result.current.focusedId).toBe("a");
  });

  it("focuses null when the queue empties out", () => {
    const { result, rerender } = renderHook(
      ({ itemIds }) =>
        useApprovalHotkeys({
          itemIds,
          onApprove: vi.fn(),
          onReject: vi.fn(),
          onOpenDrawer: vi.fn(),
        }),
      { initialProps: { itemIds: ["a"] } }
    );
    rerender({ itemIds: [] });
    expect(result.current.focusedId).toBeNull();
  });
});
