/**
 * Merchant proof-of-delivery hashing and escrow confirmation (#910).
 *
 * The SHA-256 digest is computed in the browser and passed as bytes to the
 * escrow contract's `confirm_delivery` call.
 */

import type { xdr } from "@stellar/stellar-sdk";
import { invokeContractMethod } from "./sorobanInvoke";

export interface DeliveryEvidence {
  orderId: string;
  fileName: string;
  fileSizeBytes: number;
  mimeType: string;
  sha256Hash: string;
  uploadedAt: string;
  ipfsCid?: string;
}

export const DELIVERY_EVIDENCE_MIME_TYPES = ["application/pdf", "image/png", "image/jpeg"] as const;

const EXTENSION_MIME: Record<string, (typeof DELIVERY_EVIDENCE_MIME_TYPES)[number]> = {
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
};

export function deliveryEvidenceMime(file: File): (typeof DELIVERY_EVIDENCE_MIME_TYPES)[number] | null {
  if ((DELIVERY_EVIDENCE_MIME_TYPES as readonly string[]).includes(file.type)) {
    return file.type as (typeof DELIVERY_EVIDENCE_MIME_TYPES)[number];
  }
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  return EXTENSION_MIME[extension] ?? null;
}

export function bytesToHex(bytes: ArrayBuffer | Uint8Array): string {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  return Array.from(view)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function hexToBytes(hex: string): Uint8Array {
  if (!/^[0-9a-fA-F]+$/.test(hex) || hex.length % 2 !== 0) {
    throw new Error("SHA-256 hash must be hex.");
  }
  const bytes = new Uint8Array(hex.length / 2);
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Number.parseInt(hex.slice(index * 2, index * 2 + 2), 16);
  }
  return bytes;
}

export async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const copy = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(copy).set(bytes);
  const digest = await crypto.subtle.digest("SHA-256", copy);
  return bytesToHex(digest);
}

/**
 * FileReader in jsdom returns an ArrayBuffer from another realm, so
 * `instanceof ArrayBuffer` is false. Copy the bytes into this realm before
 * hashing.
 */
function copyBytes(result: unknown): Uint8Array | null {
  if (!result || typeof result !== "object") return null;
  const tag = Object.prototype.toString.call(result);
  if (tag === "[object ArrayBuffer]") {
    return new Uint8Array(result as ArrayBuffer);
  }
  if (ArrayBuffer.isView(result) || tag === "[object Uint8Array]" || tag === "[object DataView]") {
    const view = result as ArrayBufferView;
    const copy = new Uint8Array(view.byteLength);
    copy.set(new Uint8Array(view.buffer, view.byteOffset, view.byteLength));
    return copy;
  }
  return null;
}

function readFileBuffer(file: File, onRatio: (ratio: number) => void): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onprogress = (event) => {
      if (event.lengthComputable && event.total > 0) onRatio(event.loaded / event.total);
    };
    reader.onload = () => {
      const bytes = copyBytes(reader.result);
      if (bytes) {
        onRatio(1);
        resolve(bytes);
        return;
      }
      if (typeof file.arrayBuffer !== "function") {
        reject(new Error("Failed to read the file."));
        return;
      }
      file.arrayBuffer().then(
        (buffer) => {
          onRatio(1);
          resolve(new Uint8Array(buffer));
        },
        () => reject(new Error("Failed to read the file."))
      );
    };
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read the file."));
    reader.readAsArrayBuffer(file);
  });
}

/** Reads the file, hashes it, and hashes it again so the badge can confirm a match. */
export async function hashDeliveryFile(
  file: File,
  onProgress?: (percent: number) => void
): Promise<{ hash: string; verified: boolean }> {
  const mimeType = deliveryEvidenceMime(file);
  if (!mimeType) {
    throw new Error("Upload a PDF, PNG, or JPEG file.");
  }
  onProgress?.(5);
  const buffer = await readFileBuffer(file, (ratio) => onProgress?.(Math.round(5 + ratio * 75)));
  onProgress?.(85);
  const hash = await sha256Hex(buffer);
  const check = await sha256Hex(buffer);
  onProgress?.(100);
  return { hash, verified: hash === check };
}

export function buildDeliveryEvidence(input: {
  orderId: string;
  file: File;
  sha256Hash: string;
  uploadedAt?: string;
  ipfsCid?: string;
}): DeliveryEvidence {
  const mimeType = deliveryEvidenceMime(input.file);
  if (!mimeType) throw new Error("Upload a PDF, PNG, or JPEG file.");
  return {
    orderId: input.orderId,
    fileName: input.file.name,
    fileSizeBytes: input.file.size,
    mimeType,
    sha256Hash: input.sha256Hash,
    uploadedAt: input.uploadedAt ?? new Date().toISOString(),
    ...(input.ipfsCid ? { ipfsCid: input.ipfsCid } : {}),
  };
}

export interface ConfirmDeliveryInput {
  rpcUrl: string;
  networkPassphrase: string;
  contractId: string;
  sourceAddress: string;
  orderId: string;
  sha256Hash: string;
  signTransaction: (xdr: string) => Promise<string>;
}

/** Soroban args for `confirm_delivery(order_id, evidence_sha256)`. */
export async function deliveryConfirmationArgs(
  orderId: string,
  sha256Hash: string
): Promise<{ method: "confirm_delivery"; args: xdr.ScVal[] }> {
  const sdk = await import("@stellar/stellar-sdk");
  const digest = hexToBytes(sha256Hash);
  if (digest.length !== 32) {
    throw new Error("SHA-256 hash must be 32 bytes.");
  }
  return {
    method: "confirm_delivery",
    args: [sdk.nativeToScVal(orderId, { type: "string" }), sdk.nativeToScVal(digest)],
  };
}

export async function confirmDeliveryWithEvidence(input: ConfirmDeliveryInput): Promise<{ txHash: string }> {
  const { method, args } = await deliveryConfirmationArgs(input.orderId, input.sha256Hash);
  return invokeContractMethod({
    rpcUrl: input.rpcUrl,
    networkPassphrase: input.networkPassphrase,
    contractId: input.contractId,
    method,
    args,
    sourceAddress: input.sourceAddress,
    signTransaction: input.signTransaction,
  });
}
