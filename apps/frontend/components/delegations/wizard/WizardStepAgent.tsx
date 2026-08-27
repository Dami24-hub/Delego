"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Button, FormField } from "@delegolabs/ui";
import {
  decodeAgentIdFromQrImage,
  isQrScanSupported,
} from "../../../lib/decodeAgentQr";

export interface WizardStepAgentProps {
  agentId: string;
  onAgentIdChange: (value: string) => void;
  error?: string;
}

/** Step 1 — choose the agent by pasting its ID or scanning a QR code image (#523). */
export function WizardStepAgent({
  agentId,
  onAgentIdChange,
  error,
}: WizardStepAgentProps) {
  const t = useTranslations("delegations.wizard");
  const tSteps = useTranslations("delegations.wizard.steps.agent");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const supported = isQrScanSupported();

  const handleFileSelected = async (file: File) => {
    setScanError(null);
    const decoded = await decodeAgentIdFromQrImage(file);
    if (decoded) {
      onAgentIdChange(decoded);
    } else {
      setScanError(tSteps("scanQrError"));
    }
  };

  return (
    <div className="settings-section">
      <FormField
        label={t("agentId.label")}
        required
        hint={t("agentId.hint")}
        error={error}
        inputProps={{
          value: agentId,
          onChange: (e) => onAgentIdChange(e.target.value),
          placeholder: t("agentId.placeholder"),
          style: { width: "100%" },
        }}
      />

      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          hidden
          disabled={!supported}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileSelected(file);
            e.target.value = "";
          }}
        />
        <Button
          type="button"
          variant="ghost"
          disabled={!supported}
          onClick={() => fileInputRef.current?.click()}
        >
          {tSteps("scanQr")}
        </Button>
        <p
          style={{
            fontSize: "0.875rem",
            color: "var(--color-text-muted)",
            margin: "0.5rem 0 0",
          }}
        >
          {supported ? tSteps("scanQrHint") : tSteps("scanQrUnsupported")}
        </p>
        {scanError && (
          <div className="settings-status error" role="alert">
            {scanError}
          </div>
        )}
      </div>
    </div>
  );
}
