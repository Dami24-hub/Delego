import { parseCsvCatalogImport, type CsvImportSummary } from "../lib/csvCatalogImport";

export interface CatalogImportWorkerRequest {
  id: number;
  csvText: string;
}

export interface CatalogImportWorkerResponse {
  id: number;
  ok: boolean;
  summary?: CsvImportSummary;
  error?: string;
}

self.addEventListener("message", (event: MessageEvent<CatalogImportWorkerRequest>) => {
  const { id, csvText } = event.data;
  try {
    const summary = parseCsvCatalogImport(csvText);
    const response: CatalogImportWorkerResponse = { id, ok: true, summary };
    self.postMessage(response);
  } catch (err) {
    const response: CatalogImportWorkerResponse = {
      id,
      ok: false,
      error: err instanceof Error ? err.message : "Parse failed",
    };
    self.postMessage(response);
  }
});
