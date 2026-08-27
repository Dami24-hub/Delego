import { describe, it, expect } from "vitest";
import { toCsv } from "./csv";

describe("toCsv", () => {
  it("joins header and rows with CRLF", () => {
    const csv = toCsv(
      ["A", "B"],
      [
        ["1", "2"],
        ["3", "4"],
      ]
    );
    expect(csv).toBe("A,B\r\n1,2\r\n3,4");
  });

  it("quotes fields containing commas, quotes, or newlines", () => {
    const csv = toCsv(["Name"], [['Say "hi", please\nthanks']]);
    expect(csv).toBe('Name\r\n"Say ""hi"", please\nthanks"');
  });
});
