import { describe, expect, it } from "vitest";
import {
  chunkCsvImportRows,
  parseCsvCatalogImport,
  revalidateCsvImportRow,
  type CsvImportRow,
} from "./csvCatalogImport";

const HEADER = "sku,title,priceStroops,stock";

describe("parseCsvCatalogImport (#909)", () => {
  it("keeps invalid rows in the preview with messages", () => {
    const summary = parseCsvCatalogImport(
      [HEADER, "SKU-1,Mug,1500000,4", ",Missing,nope,-1", 'SKU-2,"Bowl, Large",900000,2'].join("\n")
    );
    expect(summary.totalRows).toBe(3);
    expect(summary.validRows).toBe(2);
    expect(summary.errorRows).toBe(1);
    expect(summary.parsedProducts[1].isValid).toBe(false);
    expect(summary.parsedProducts[1].errors.join(" ")).toMatch(/sku is required/);
    expect(summary.parsedProducts[2].title).toBe("Bowl, Large");
  });

  it("rejects the wrong header and an empty file", () => {
    expect(() => parseCsvCatalogImport("")).toThrow(/empty/);
    expect(() => parseCsvCatalogImport("name,cost\nMug,5")).toThrow(/Header must be/);
  });

  it("revalidates an edited row and chunks submissions", () => {
    const broken = parseCsvCatalogImport([HEADER, ",Mug,1500000,1"].join("\n")).parsedProducts[0];
    const fixed: CsvImportRow = revalidateCsvImportRow({ ...broken, sku: "SKU-9" });
    expect(fixed.isValid).toBe(true);
    const batches = chunkCsvImportRows([1, 2, 3], 2);
    expect(batches).toEqual([[1, 2], [3]]);
  });
});
