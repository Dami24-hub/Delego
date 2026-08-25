"use client";

import { useCallback, useEffect, useState } from "react";

const DISMISSED_STORAGE_KEY = "delego-install-dismissed";

/** Chrome's non-standard `beforeinstallprompt` event — not yet in lib.dom.d.ts. */
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export interface UsePwaInstallResult {
  /** True once the browser has told us the app is eligible to install and the user hasn't dismissed the card. */
  canInstall: boolean;
  /** Shows the browser's native install prompt. Resolves to whether the user accepted. */
  promptInstall: () => Promise<boolean>;
  /** Hides the card and remembers the choice (until localStorage is cleared). */
  dismiss: () => void;
}

/**
 * Wraps the `beforeinstallprompt` flow for a custom in-app install card.
 * Chromium-based browsers fire this event on eligible devices (roughly:
 * served over HTTPS, valid manifest + icons, registered service worker);
 * Safari and Firefox never fire it, so `canInstall` simply stays false there
 * — no install card, no crash.
 */
export function usePwaInstall(): UsePwaInstallResult {
  const [deferredEvent, setDeferredEvent] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(true);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    try {
      setDismissed(window.localStorage.getItem(DISMISSED_STORAGE_KEY) === "1");
    } catch {
      setDismissed(false);
    }

    function onBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setDeferredEvent(event as BeforeInstallPromptEvent);
    }
    function onInstalled() {
      setInstalled(true);
      setDeferredEvent(null);
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferredEvent) return false;
    await deferredEvent.prompt();
    const { outcome } = await deferredEvent.userChoice;
    setDeferredEvent(null);
    return outcome === "accepted";
  }, [deferredEvent]);

  const dismiss = useCallback(() => {
    setDismissed(true);
    try {
      window.localStorage.setItem(DISMISSED_STORAGE_KEY, "1");
    } catch {
      // localStorage unavailable — the card just won't stay dismissed across reloads.
    }
  }, []);

  return {
    canInstall: Boolean(deferredEvent) && !dismissed && !installed,
    promptInstall,
    dismiss,
  };
}
