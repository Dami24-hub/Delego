import { parseCsvCatalogImport, type CsvImportSummary } from "./csvCatalogImport";
import type { CatalogImportWorkerResponse } from "../workers/catalogImportWorker";

/**
 * Parses catalog CSV off the main thread. Falls back to the synchronous
 * parser when `Worker` is unavailable (tests and older browsers).
 */
export function parseCsvCatalogInWorker(csvText: string): Promise<CsvImportSummary> {
  if (typeof Worker === "undefined") {
    return Promise.resolve(parseCsvCatalogImport(csvText));
  }

  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL("../workers/catalogImportWorker.ts", import.meta.url), {
      type: "module",
    });
    const timer = setTimeout(() => {
      worker.terminate();
      reject(new Error("Catalog import timed out."));
    }, 30_000);

    worker.onmessage = (event: MessageEvent<CatalogImportWorkerResponse>) => {
      clearTimeout(timer);
      worker.terminate();
      if (!event.data.ok || !event.data.summary) {
        reject(new Error(event.data.error ?? "Parse failed"));
        return;
      }
      resolve(event.data.summary);
    };
    worker.onerror = () => {
      clearTimeout(timer);
      worker.terminate();
      reject(new Error("Catalog import worker failed."));
    };
    worker.postMessage({ id: 1, csvText });
  });
}
