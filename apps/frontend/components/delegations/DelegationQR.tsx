"use client";

import { useState, useEffect } from "react";

/** Props required to generate a delegation QR payload. */
export interface DelegationQRProps {
  delegationId: string;
  userId: string;
  agentId: string;
}

/**
 * QR Code component for delegation sharing
 * Encodes delegation data as JSON and generates a QR code
 * Allows users to download the QR code as PNG
 */
export function DelegationQR({
  delegationId,
  userId,
  agentId,
}: DelegationQRProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const generateQR = async () => {
      try {
        // Dynamically import qrcode library only in browser
        const QRCode = (await import("qrcode")).default;

        // Create delegation data object
        const delegationData = {
          delegationId,
          userId,
          agentId,
          timestamp: new Date().toISOString(),
        };

        // Generate QR code as data URL
        const dataUrl = await QRCode.toDataURL(JSON.stringify(delegationData), {
          width: 300,
          margin: 2,
          color: {
            dark: "#000000",
            light: "#ffffff",
          },
          errorCorrectionLevel: "H",
        });

        setQrDataUrl(dataUrl);
        setError(null);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to generate QR code";
        setError(message);
        console.error("QR code generation error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    generateQR();
  }, [delegationId, userId, agentId]);

  const handleDownload = () => {
    if (!qrDataUrl) return;

    const link = document.createElement("a");
    link.href = qrDataUrl;
    link.download = `delegation-${delegationId}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "2rem",
          color: "#666",
        }}
      >
        Generating QR code...
      </div>
    );
  }

  if (error) {
    return (
      <div
        role="alert"
        style={{
          padding: "1rem",
          backgroundColor: "#fee2e2",
          border: "1px solid #fecaca",
          borderRadius: "0.5rem",
          color: "#dc2626",
        }}
      >
        {error}
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "1rem",
        padding: "1.5rem",
        border: "1px solid #e5e7eb",
        borderRadius: "0.5rem",
        backgroundColor: "#f9fafb",
      }}
    >
      <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 600 }}>
        Delegation QR Code
      </h3>
      {qrDataUrl && (
        <img
          src={qrDataUrl}
          alt="Delegation QR Code"
          style={{
            border: "2px solid #e5e7eb",
            borderRadius: "0.375rem",
            padding: "0.5rem",
            backgroundColor: "white",
          }}
          aria-label={`QR code for delegation ${delegationId}`}
        />
      )}
      <button
        onClick={handleDownload}
        type="button"
        style={{
          padding: "0.5rem 1rem",
          backgroundColor: "#2563eb",
          color: "white",
          border: "none",
          borderRadius: "0.375rem",
          cursor: "pointer",
          fontSize: "0.875rem",
          fontWeight: 500,
          transition: "background-color 0.2s",
        }}
        onMouseOver={(e) => {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor =
            "#1d4ed8";
        }}
        onMouseOut={(e) => {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor =
            "#2563eb";
        }}
      >
        Download QR Code
      </button>
      <p
        style={{
          margin: 0,
          fontSize: "0.875rem",
          color: "#666",
          textAlign: "center",
        }}
      >
        Share this QR code with agent services to import your delegation
      </p>
    </div>
  );
}
