import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useAnnouncements } from "./useAnnouncements";

const STORAGE_KEY = "delego_dismissed_announcements";

const feed = [
  { id: "a1", message: "First announcement", severity: "info" },
  { id: "a2", message: "Second announcement", severity: "warning" },
];

describe("useAnnouncements", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => feed,
      })
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("loads announcements from the feed", async () => {
    const { result } = renderHook(() => useAnnouncements());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.announcements).toHaveLength(2);
    expect(result.current.announcements[0].id).toBe("a1");
  });

  it("hides a dismissed announcement and persists the id", async () => {
    const { result } = renderHook(() => useAnnouncements());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.dismiss("a1");
    });

    expect(result.current.announcements.map((a) => a.id)).toEqual(["a2"]);
    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]");
    expect(stored).toContain("a1");
  });

  it("keeps a dismissal across remounts (new session)", async () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(["a1"]));

    const { result } = renderHook(() => useAnnouncements());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.announcements.map((a) => a.id)).toEqual(["a2"]);
  });

  it("re-shows a new id even when a different id was dismissed", async () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(["some-old-id"]));

    const { result } = renderHook(() => useAnnouncements());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.announcements.map((a) => a.id)).toEqual(["a1", "a2"]);
  });
});
