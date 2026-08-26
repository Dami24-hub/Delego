/**
 * Decodes an agent ID out of a QR code image using the browser's native
 * BarcodeDetector API (#523) — no extra dependency, no camera permission
 * needed since the source is a file the user picks, not a live camera feed
 * (the app's Permissions-Policy denies camera access entirely, see
 * next.config.ts). Returns null if the API is unsupported, no QR code is
 * found, or the payload isn't recognizable delegation QR JSON (see
 * DelegationQR.tsx for the encoding this decodes).
 */
export async function decodeAgentIdFromQrImage(file: File): Promise<string | null> {
  if (typeof window === "undefined" || !("BarcodeDetector" in window)) {
    return null;
  }

  const bitmap = await createImageBitmap(file);
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- BarcodeDetector isn't in the TS DOM lib yet
    const DetectorCtor = (window as any).BarcodeDetector;
    const detector = new DetectorCtor({ formats: ["qr_code"] });
    const barcodes = await detector.detect(bitmap);
    const raw = barcodes[0]?.rawValue as string | undefined;
    if (!raw) return null;

    try {
      const parsed: unknown = JSON.parse(raw);
      if (
        typeof parsed === "object" &&
        parsed !== null &&
        "agentId" in parsed &&
        typeof (parsed as { agentId: unknown }).agentId === "string"
      ) {
        return (parsed as { agentId: string }).agentId;
      }
    } catch {
      // Not JSON — fall back to treating the raw QR payload as the agent ID directly.
    }
    return raw;
  } finally {
    bitmap.close();
  }
}

export function isQrScanSupported(): boolean {
  return typeof window !== "undefined" && "BarcodeDetector" in window;
}
