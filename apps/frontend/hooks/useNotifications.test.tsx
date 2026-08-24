import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import type { ReactNode } from "react";
import { NotificationProvider, useNotifications } from "./useNotifications";

const STORAGE_KEY = "delego_notifications";

function wrapper({ children }: { children: ReactNode }) {
  return <NotificationProvider>{children}</NotificationProvider>;
}

describe("useNotifications", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("starts empty and loads persisted notifications on mount", async () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([
        { id: "1", type: "info", title: "Hi", createdAt: 1, read: false },
      ])
    );

    const { result } = renderHook(() => useNotifications(), { wrapper });

    await waitFor(() => expect(result.current.notifications).toHaveLength(1));
    expect(result.current.notifications[0].title).toBe("Hi");
  });

  it("ignores malformed stored entries", async () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([{ id: "1" }, "not-an-object", null])
    );

    const { result } = renderHook(() => useNotifications(), { wrapper });

    await waitFor(() => expect(result.current.notifications).toHaveLength(0));
  });

  it("ignores a non-array stored payload", async () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ foo: "bar" }));

    const { result } = renderHook(() => useNotifications(), { wrapper });

    await waitFor(() => expect(result.current.notifications).toHaveLength(0));
  });

  it("tolerates invalid JSON in storage", async () => {
    window.localStorage.setItem(STORAGE_KEY, "{not json");

    const { result } = renderHook(() => useNotifications(), { wrapper });

    await waitFor(() => expect(result.current.notifications).toHaveLength(0));
  });

  it("add() prepends a new notification and returns its id", async () => {
    const { result } = renderHook(() => useNotifications(), { wrapper });
    await waitFor(() => expect(result.current.notifications).toHaveLength(0));

    let id = "";
    act(() => {
      id = result.current.add({ type: "success", title: "Approved" });
    });

    expect(id).toBeTruthy();
    expect(result.current.notifications[0].title).toBe("Approved");
    expect(result.current.notifications[0].read).toBe(false);
    expect(result.current.unreadCount).toBe(1);
  });

  it("add() deduplicates by explicit id, keeping the newest entry first", async () => {
    const { result } = renderHook(() => useNotifications(), { wrapper });
    await waitFor(() => expect(result.current.notifications).toHaveLength(0));

    act(() => {
      result.current.add({ id: "dup", type: "info", title: "First" });
    });
    act(() => {
      result.current.add({ id: "dup", type: "info", title: "Second" });
    });

    expect(result.current.notifications).toHaveLength(1);
    expect(result.current.notifications[0].title).toBe("Second");
  });

  it("caps the stored list at 50 most-recent notifications", async () => {
    const { result } = renderHook(() => useNotifications(), { wrapper });
    await waitFor(() => expect(result.current.notifications).toHaveLength(0));

    act(() => {
      for (let i = 0; i < 55; i++) {
        result.current.add({ type: "info", title: `n${i}` });
      }
    });

    expect(result.current.notifications).toHaveLength(50);
    expect(result.current.notifications[0].title).toBe("n54");
  });

  it("markAsRead flips only the targeted notification", async () => {
    const { result } = renderHook(() => useNotifications(), { wrapper });
    await waitFor(() => expect(result.current.notifications).toHaveLength(0));

    let idA = "";
    let idB = "";
    act(() => {
      idA = result.current.add({ type: "info", title: "A" });
      idB = result.current.add({ type: "info", title: "B" });
    });

    act(() => {
      result.current.markAsRead(idA);
    });

    const a = result.current.notifications.find((n) => n.id === idA);
    const b = result.current.notifications.find((n) => n.id === idB);
    expect(a?.read).toBe(true);
    expect(b?.read).toBe(false);
    expect(result.current.unreadCount).toBe(1);
  });

  it("markAllAsRead clears unreadCount without duplicating entries", async () => {
    const { result } = renderHook(() => useNotifications(), { wrapper });
    await waitFor(() => expect(result.current.notifications).toHaveLength(0));

    act(() => {
      result.current.add({ type: "info", title: "A" });
      result.current.add({ type: "warning", title: "B" });
    });

    act(() => {
      result.current.markAllAsRead();
    });

    expect(result.current.unreadCount).toBe(0);
    expect(result.current.notifications).toHaveLength(2);
  });

  it("remove() drops a single notification by id", async () => {
    const { result } = renderHook(() => useNotifications(), { wrapper });
    await waitFor(() => expect(result.current.notifications).toHaveLength(0));

    let id = "";
    act(() => {
      id = result.current.add({ type: "error", title: "Fail" });
      result.current.add({ type: "info", title: "Other" });
    });

    act(() => {
      result.current.remove(id);
    });

    expect(result.current.notifications).toHaveLength(1);
    expect(result.current.notifications[0].title).toBe("Other");
  });

  it("clearAll empties the list", async () => {
    const { result } = renderHook(() => useNotifications(), { wrapper });
    await waitFor(() => expect(result.current.notifications).toHaveLength(0));

    act(() => {
      result.current.add({ type: "info", title: "A" });
      result.current.add({ type: "info", title: "B" });
    });

    act(() => {
      result.current.clearAll();
    });

    expect(result.current.notifications).toHaveLength(0);
    expect(result.current.unreadCount).toBe(0);
  });

  it("persists changes to localStorage", async () => {
    const { result } = renderHook(() => useNotifications(), { wrapper });
    await waitFor(() => expect(result.current.notifications).toHaveLength(0));

    act(() => {
      result.current.add({ type: "info", title: "Persisted" });
    });

    await waitFor(() => {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      expect(raw).toContain("Persisted");
    });
  });

  it("syncs additions from other tabs via the storage event", async () => {
    const { result } = renderHook(() => useNotifications(), { wrapper });
    await waitFor(() => expect(result.current.notifications).toHaveLength(0));

    act(() => {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify([
          { id: "x", type: "info", title: "From other tab", createdAt: 1, read: false },
        ])
      );
      window.dispatchEvent(
        new StorageEvent("storage", { key: STORAGE_KEY, newValue: "x" })
      );
    });

    expect(result.current.notifications).toHaveLength(1);
    expect(result.current.notifications[0].title).toBe("From other tab");
  });

  it("ignores storage events for unrelated keys", async () => {
    const { result } = renderHook(() => useNotifications(), { wrapper });
    await waitFor(() => expect(result.current.notifications).toHaveLength(0));

    act(() => {
      result.current.add({ type: "info", title: "Keep me" });
    });

    act(() => {
      window.dispatchEvent(
        new StorageEvent("storage", { key: "unrelated", newValue: "[]" })
      );
    });

    expect(result.current.notifications).toHaveLength(1);
    expect(result.current.notifications[0].title).toBe("Keep me");
  });

  it("throws when used outside a NotificationProvider", () => {
    expect(() => renderHook(() => useNotifications())).toThrow(
      "useNotifications must be used within a NotificationProvider"
    );
  });
});
