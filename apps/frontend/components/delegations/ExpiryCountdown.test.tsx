import { render, screen, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ExpiryCountdown } from "./ExpiryCountdown";

describe("ExpiryCountdown", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns null if no expiresAt is provided", () => {
    const { container } = render(<ExpiryCountdown expiresAt={null} />);
    expect(container.firstChild).toBeNull();
  });

  it("displays correct time remaining", () => {
    const now = new Date("2026-07-25T10:00:00Z").getTime();
    vi.setSystemTime(now);

    // 1 hour, 30 minutes, 15 seconds from now
    const expiresAt = new Date(
      now + 1000 * (15 + 60 * 30 + 60 * 60 * 1)
    ).toISOString();

    render(<ExpiryCountdown expiresAt={expiresAt} />);

    const countdown = screen.getByTestId("countdown-timer");
    expect(countdown.textContent).toContain("1h 30m 15s remaining");
  });

  it("updates countdown over time", () => {
    const now = new Date("2026-07-25T10:00:00Z").getTime();
    vi.setSystemTime(now);

    const expiresAt = new Date(now + 10000).toISOString(); // 10 seconds

    render(<ExpiryCountdown expiresAt={expiresAt} />);

    expect(screen.getByTestId("countdown-timer").textContent).toContain(
      "10s remaining"
    );

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(screen.getByTestId("countdown-timer").textContent).toContain(
      "8s remaining"
    );
  });

  it("shows Expired badge when time is up", () => {
    const now = new Date("2026-07-25T10:00:00Z").getTime();
    vi.setSystemTime(now);

    const expiresAt = new Date(now - 1000).toISOString(); // 1 second ago

    render(<ExpiryCountdown expiresAt={expiresAt} />);

    const badge = screen.getByTestId("expired-badge");
    expect(badge).toBeDefined();
    expect(badge.textContent).toBe("Expired");
  });

  it("changes color based on time remaining", () => {
    const now = new Date("2026-07-25T10:00:00Z").getTime();
    vi.setSystemTime(now);

    // Red: < 5 minutes
    const expiresAtRed = new Date(now + 1000 * 60 * 4).toISOString();
    const { rerender } = render(<ExpiryCountdown expiresAt={expiresAtRed} />);
    expect(screen.getByTestId("countdown-timer").className).toContain(
      "text-red-500"
    );

    // Orange: < 1 hour
    const expiresAtOrange = new Date(now + 1000 * 60 * 30).toISOString();
    rerender(<ExpiryCountdown expiresAt={expiresAtOrange} />);
    expect(screen.getByTestId("countdown-timer").className).toContain(
      "text-orange-500"
    );

    // Yellow: < 24 hours
    const expiresAtYellow = new Date(now + 1000 * 60 * 60 * 12).toISOString();
    rerender(<ExpiryCountdown expiresAt={expiresAtYellow} />);
    expect(screen.getByTestId("countdown-timer").className).toContain(
      "text-yellow-500"
    );

    // Green: >= 24 hours
    const expiresAtGreen = new Date(now + 1000 * 60 * 60 * 48).toISOString();
    rerender(<ExpiryCountdown expiresAt={expiresAtGreen} />);
    expect(screen.getByTestId("countdown-timer").className).toContain(
      "text-green-500"
    );
  });
});
