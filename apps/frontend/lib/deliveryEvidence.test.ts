import { describe, expect, it, vi } from "vitest";
import { scValToNative } from "@stellar/stellar-sdk";
import {
  bytesToHex,
  confirmDeliveryWithEvidence,
  deliveryConfirmationArgs,
  deliveryEvidenceMime,
  hashDeliveryFile,
  sha256Hex,
} from "./deliveryEvidence";

vi.mock("./sorobanInvoke", () => ({
  invokeContractMethod: vi.fn(async () => ({ txHash: "tx-evidence" })),
}));

describe("delivery evidence (#910)", () => {
  it("hashes with SHA-256 and only accepts PDF, PNG, and JPEG", async () => {
    const encoded = new TextEncoder().encode("abc");
    expect(await sha256Hex(encoded)).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"
    );
    expect(deliveryEvidenceMime(new File(["x"], "note.pdf", { type: "application/pdf" }))).toBe(
      "application/pdf"
    );
    expect(deliveryEvidenceMime(new File(["x"], "note.gif", { type: "image/gif" }))).toBeNull();
  });

  it("verifies the digest matches a second client-side hash", async () => {
    const file = new File([new Uint8Array([1, 2, 3, 4])], "receipt.png", { type: "image/png" });
    const progress: number[] = [];
    const result = await hashDeliveryFile(file, (percent) => progress.push(percent));
    expect(result.verified).toBe(true);
    expect(result.hash).toMatch(/^[0-9a-f]{64}$/);
    expect(progress[progress.length - 1]).toBe(100);
  });

  it("passes the authentic SHA-256 bytes into confirm_delivery", async () => {
    const { invokeContractMethod } = await import("./sorobanInvoke");
    const hash = await sha256Hex(new TextEncoder().encode("proof"));
    const { args } = await deliveryConfirmationArgs("order-1", hash);
    expect(scValToNative(args[0])).toBe("order-1");
    const digest = scValToNative(args[1]);
    expect(bytesToHex(digest instanceof Uint8Array ? digest : new Uint8Array(digest as ArrayBuffer))).toBe(hash);

    const result = await confirmDeliveryWithEvidence({
      rpcUrl: "https://soroban.test",
      networkPassphrase: "Test",
      contractId: "CABC",
      sourceAddress: "GABC",
      orderId: "order-1",
      sha256Hash: hash,
      signTransaction: async (xdr) => xdr,
    });
    expect(result.txHash).toBe("tx-evidence");
    expect(invokeContractMethod).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "confirm_delivery",
        contractId: "CABC",
        args,
      })
    );
  });
});
