import { describe, it, expect } from "vitest";
import { parseAcceptLanguage } from "./acceptLanguage";

describe("parseAcceptLanguage", () => {
  it("returns undefined for a missing header", () => {
    expect(parseAcceptLanguage(null)).toBeUndefined();
    expect(parseAcceptLanguage(undefined)).toBeUndefined();
    expect(parseAcceptLanguage("")).toBeUndefined();
  });

  it("returns the primary subtag of a single language", () => {
    expect(parseAcceptLanguage("de")).toBe("de");
    expect(parseAcceptLanguage("de-DE")).toBe("de");
  });

  it("picks the first tag when no q-values are present", () => {
    expect(parseAcceptLanguage("fr, en, de")).toBe("fr");
  });

  it("picks the highest-quality tag even when it isn't listed first", () => {
    expect(parseAcceptLanguage("en-US;q=0.5, de;q=0.9")).toBe("de");
  });

  it("treats a tag with no explicit q as quality 1", () => {
    expect(parseAcceptLanguage("de;q=0.9, en")).toBe("en");
  });

  it("falls back to quality 1 for an unparsable q value", () => {
    expect(parseAcceptLanguage("de;q=notanumber")).toBe("de");
  });
});
