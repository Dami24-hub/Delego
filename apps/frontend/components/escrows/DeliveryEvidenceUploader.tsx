"use client";

import { useState, type DragEvent } from "react";
import { Button } from "@delegolabs/ui";
import { useNetwork } from "../../hooks/useNetwork";
import { useWallet } from "../../hooks/useWallet";
import { getConfiguredContracts } from "../../lib/contracts";
import {
  buildDeliveryEvidence,
  confirmDeliveryWithEvidence,
  hashDeliveryFile,
  type DeliveryEvidence,
} from "../../lib/deliveryEvidence";
import { signWithFreighter } from "../../lib/sorobanInvoke";

export interface DeliveryEvidenceUploaderProps {
  orderId: string;
  open: boolean;
  onClose: () => void;
  onConfirmed?: (evidence: DeliveryEvidence, txHash: string) => void;
}

/**
 * Dropzone for courier receipts and delivery photos. The file never leaves
 * the browser until its SHA-256 digest is attached to `confirm_delivery` (#910).
 */
export function DeliveryEvidenceUploader({
  orderId,
  open,
  onClose,
  onConfirmed,
}: DeliveryEvidenceUploaderProps) {
  const { networkId, network } = useNetwork();
  const { address } = useWallet();
  const escrow = getConfiguredContracts(networkId).find((entry) => entry.name === "escrow");
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [hash, setHash] = useState<string | null>(null);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  if (!open) return null;

  async function ingest(next: File) {
    setError(null);
    setHash(null);
    setVerified(false);
    setFile(next);
    setProgress(0);
    try {
      const result = await hashDeliveryFile(next, setProgress);
      setHash(result.hash);
      setVerified(result.verified);
    } catch (err) {
      setFile(null);
      setProgress(0);
      setError(err instanceof Error ? err.message : "Could not hash that file.");
    }
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragActive(false);
    const dropped = event.dataTransfer.files?.[0];
    if (dropped) void ingest(dropped);
  }

  async function submit() {
    if (!file || !hash || !verified) return;
    if (!address) {
      setError("Connect a wallet before confirming delivery.");
      return;
    }
    if (!escrow?.address || !escrow.addressValid) {
      setError("Escrow contract is not configured for this network.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const evidence = buildDeliveryEvidence({ orderId, file, sha256Hash: hash });
      const { txHash } = await confirmDeliveryWithEvidence({
        rpcUrl: network.sorobanRpcUrl,
        networkPassphrase: network.networkPassphrase,
        contractId: escrow.address,
        sourceAddress: address,
        orderId,
        sha256Hash: evidence.sha256Hash,
        signTransaction: (xdr) => signWithFreighter(xdr, network.networkPassphrase, address),
      });
      onConfirmed?.(evidence, txHash);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delivery confirmation failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section
      aria-label="Proof of delivery"
      data-testid="delivery-evidence-uploader"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem",
        padding: "1rem",
        border: "1px solid #e5e7eb",
        borderRadius: "0.75rem",
        background: "#fff",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ margin: 0, fontSize: "1rem" }}>Proof of delivery</h2>
        <Button type="button" variant="ghost" onClick={onClose}>
          Close
        </Button>
      </div>
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={onDrop}
        style={{
          border: `1px dashed ${dragActive ? "#2563eb" : "#d1d5db"}`,
          borderRadius: "0.75rem",
          padding: "0.875rem",
          background: dragActive ? "#eff6ff" : "#f9fafb",
        }}
      >
        <p style={{ margin: "0 0 0.5rem", fontSize: "0.8125rem" }}>
          Drop a PDF, PNG, or JPEG courier receipt or delivery photo.
        </p>
        <input
          type="file"
          accept="application/pdf,image/png,image/jpeg,.pdf,.png,.jpg,.jpeg"
          aria-label="Proof of delivery file"
          data-testid="delivery-evidence-input"
          onChange={(event) => {
            const next = event.target.files?.[0];
            if (next) void ingest(next);
            event.target.value = "";
          }}
        />
      </div>

      {file ? (
        <p style={{ margin: 0, fontSize: "0.8125rem" }}>
          {file.name} · {file.size.toLocaleString()} bytes
        </p>
      ) : null}

      <label style={{ fontSize: "0.75rem", color: "#6b7280" }}>
        Hash progress
        <progress
          data-testid="delivery-evidence-progress"
          value={progress}
          max={100}
          style={{ display: "block", width: "100%", marginTop: "0.25rem" }}
        />
      </label>

      {hash && verified ? (
        <p data-testid="delivery-evidence-hash-badge" style={{ margin: 0, color: "#047857", fontSize: "0.8125rem" }}>
          SHA-256 verified · {hash}
        </p>
      ) : null}

      {error ? (
        <p role="alert" style={{ margin: 0, color: "#b91c1c", fontSize: "0.8125rem" }}>
          {error}
        </p>
      ) : null}

      <Button
        type="button"
        onClick={() => void submit()}
        disabled={!verified || submitting}
        data-testid="delivery-evidence-submit"
      >
        {submitting ? "Confirming…" : "Confirm delivery"}
      </Button>
    </section>
  );
}
