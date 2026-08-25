"use client";

import { usePwaInstall } from "../../hooks/usePwaInstall";

/** Dismissible in-app install card, shown only on devices Chrome/Edge/etc. report as install-eligible. */
export function InstallPromptCard() {
  const { canInstall, promptInstall, dismiss } = usePwaInstall();

  if (!canInstall) return null;

  return (
    <div className="install-prompt-card" role="status">
      <span className="install-prompt-icon" aria-hidden="true">
        📲
      </span>
      <div className="install-prompt-text">
        <p className="install-prompt-title">Install Delego</p>
        <p className="install-prompt-subtitle">
          Add it to your home screen for one-tap access and offline order
          history.
        </p>
      </div>
      <button
        type="button"
        className="install-prompt-action"
        onClick={() => promptInstall()}
      >
        Install
      </button>
      <button
        type="button"
        className="install-prompt-dismiss"
        onClick={dismiss}
        aria-label="Dismiss install prompt"
      >
        ✕
      </button>
    </div>
  );
}
