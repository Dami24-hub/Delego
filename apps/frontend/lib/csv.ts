import { downloadBlob } from "./download";

/** Escapes a single CSV field per RFC 4180 (quotes when it contains a comma, quote, or newline). */
function csvField(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/** Builds a CSV string from a header row and data rows. */
export function toCsv(header: string[], rows: string[][]): string {
  return [header, ...rows]
    .map((row) => row.map(csvField).join(","))
    .join("\r\n");
}

/** Triggers a browser download of `content` as a file named `filename`. */
export function downloadCsv(filename: string, content: string): void {
  downloadBlob(filename, new Blob([content], { type: "text/csv;charset=utf-8;" }));
}
