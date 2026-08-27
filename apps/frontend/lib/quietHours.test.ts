import { describe, expect, it } from "vitest";
import {
  isQuietHoursActive,
  shouldMuteForQuietHours,
  type QuietHoursConfig,
} from "./quietHours";

describe("Quiet Hours Boundary Math & Evaluation (#602)", () => {
  const baseConfig: QuietHoursConfig = {
    enabled: true,
    startTime: "22:00",
    endTime: "07:00",
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    bypassApprovals: true,
  };

  it("handles overnight windows (22:00 to 07:00)", () => {
    // 23:30 (during quiet hours)
    const nightTime = new Date("2026-03-15T23:30:00");
    expect(isQuietHoursActive(nightTime, baseConfig)).toBe(true);

    // 03:15 (during quiet hours morning after)
    const earlyMorning = new Date("2026-03-16T03:15:00");
    expect(isQuietHoursActive(earlyMorning, baseConfig)).toBe(true);

    // 14:00 (outside quiet hours)
    const afternoon = new Date("2026-03-16T14:00:00");
    expect(isQuietHoursActive(afternoon, baseConfig)).toBe(false);
  });

  it("handles same-day windows (09:00 to 17:00)", () => {
    const daytimeConfig: QuietHoursConfig = {
      ...baseConfig,
      startTime: "09:00",
      endTime: "17:00",
    };

    const inWindow = new Date("2026-03-16T12:00:00");
    expect(isQuietHoursActive(inWindow, daytimeConfig)).toBe(true);

    const outWindow = new Date("2026-03-16T20:00:00");
    expect(isQuietHoursActive(outWindow, daytimeConfig)).toBe(false);
  });

  it("respects day of week mask across overnight transitions", () => {
    const weekdayOnlyConfig: QuietHoursConfig = {
      ...baseConfig,
      daysOfWeek: [1, 2, 3, 4, 5], // Mon..Fri only
    };

    // Sunday night 23:00 (Sunday = 0, not in mask)
    const sundayNight = new Date("2026-03-15T23:00:00"); // Sunday
    expect(isQuietHoursActive(sundayNight, weekdayOnlyConfig)).toBe(false);

    // Monday night 23:00 (Monday = 1, in mask)
    const mondayNight = new Date("2026-03-16T23:00:00"); // Monday
    expect(isQuietHoursActive(mondayNight, weekdayOnlyConfig)).toBe(true);
  });

  it("bypasses quiet hours for urgent approval alerts when bypassApprovals is true", () => {
    const nightTime = new Date("2026-03-15T23:30:00");

    const routineNotification = {
      title: "Order Shipped",
      severity: "routine" as const,
      type: "info" as const,
    };
    expect(
      shouldMuteForQuietHours(routineNotification, baseConfig, nightTime)
    ).toBe(true);

    const approvalNotification = {
      title: "Approval Required: Order #100",
      severity: "approval" as const,
      type: "warning" as const,
    };
    expect(
      shouldMuteForQuietHours(approvalNotification, baseConfig, nightTime)
    ).toBe(false);
  });

  it("mutes approval alerts if bypassApprovals is disabled", () => {
    const strictConfig: QuietHoursConfig = {
      ...baseConfig,
      bypassApprovals: false,
    };
    const nightTime = new Date("2026-03-15T23:30:00");

    const approvalNotification = {
      title: "Approval Required: Order #100",
      severity: "approval" as const,
      type: "warning" as const,
    };
    expect(
      shouldMuteForQuietHours(approvalNotification, strictConfig, nightTime)
    ).toBe(true);
  });
});
