import { describe, it, expect } from "vitest";
import { formatDate, formatDateTime, formatNumber } from "./intl";

describe("formatDate", () => {
  it("formats using the given locale", () => {
    const date = new Date(Date.UTC(2026, 0, 15));
    expect(formatDate(date, "en-US")).toContain("2026");
    expect(formatDate(date, "de-DE")).toContain("2026");
  });

  it("respects custom formatting options", () => {
    const date = new Date(Date.UTC(2026, 0, 15));
    const result = formatDate(date, "en-US", { year: "numeric" });
    expect(result).toBe("2026");
  });
});

describe("formatDateTime", () => {
  it("includes both date and time by default", () => {
    const date = new Date(Date.UTC(2026, 0, 15, 12, 30));
    const result = formatDateTime(date, "en-US");
    expect(result).toContain("2026");
  });
});

describe("formatNumber", () => {
  it("formats numbers per the given locale", () => {
    expect(formatNumber(1234.5, "en-US")).toBe("1,234.5");
    expect(formatNumber(1234.5, "de-DE")).toBe("1.234,5");
  });

  it("applies custom options", () => {
    expect(
      formatNumber(0.4567, "en-US", { style: "percent", maximumFractionDigits: 1 })
    ).toBe("45.7%");
  });
});
