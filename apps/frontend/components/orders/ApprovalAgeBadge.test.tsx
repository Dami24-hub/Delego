import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { ApprovalAgeBadge } from "./ApprovalAgeBadge";

describe("ApprovalAgeBadge", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-10T00:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders a compact age label", () => {
    render(<ApprovalAgeBadge createdAt={new Date("2026-01-09T22:00:00Z")} />);
    expect(screen.getByText("2h")).toBeDefined();
  });

  it("is styled normal below the warning threshold", () => {
    render(<ApprovalAgeBadge createdAt={new Date("2026-01-09T22:00:00Z")} />);
    expect(screen.getByText("2h").className).toContain("approval-age-normal");
  });

  it("is styled amber/warning past the (default 12h) SLA threshold", () => {
    render(<ApprovalAgeBadge createdAt={new Date("2026-01-09T06:00:00Z")} />);
    expect(screen.getByText("18h").className).toContain("approval-age-warning");
  });

  it("is styled red/critical past the (default 48h) threshold", () => {
    render(<ApprovalAgeBadge createdAt={new Date("2026-01-07T00:00:00Z")} />);
    expect(screen.getByText("3d").className).toContain("approval-age-critical");
  });

  it("respects custom SLA thresholds", () => {
    render(
      <ApprovalAgeBadge
        createdAt={new Date("2026-01-09T22:00:00Z")}
        warningHours={1}
        criticalHours={2}
      />
    );
    expect(screen.getByText("2h").className).toContain("approval-age-critical");
  });

  it("refreshes the label live as time passes", () => {
    render(
      <ApprovalAgeBadge
        createdAt={new Date("2026-01-09T23:59:00Z")}
        refreshMs={60_000}
      />
    );
    expect(screen.getByText("1m")).toBeDefined();

    // Advancing fake time also advances the interval's clock reads — don't
    // additionally call setSystemTime, or the age would double-count.
    act(() => {
      vi.advanceTimersByTime(60_000);
    });

    expect(screen.getByText("2m")).toBeDefined();
  });

  it("shows the absolute waiting-since time as a tooltip", () => {
    render(<ApprovalAgeBadge createdAt={new Date("2026-01-09T22:00:00Z")} />);
    expect(screen.getByText("2h").title).toMatch(/Waiting since/);
  });
});
