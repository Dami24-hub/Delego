"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import * as Sentry from "@sentry/nextjs";
import { useNetwork } from "../../hooks/useNetwork";
import { useWallet } from "../../hooks/useWallet";

/**
 * Feeds Sentry breadcrumb context for the current route, active Stellar
 * network, and whether a wallet is connected (#511). Never reports the
 * wallet address itself — only its presence — unless the user has opted in
 * (no such opt-in exists yet, so the address is always omitted).
 */
export function SentryBreadcrumbs() {
  const pathname = usePathname();
  const { networkId } = useNetwork();
  const { status: walletStatus } = useWallet();

  useEffect(() => {
    Sentry.addBreadcrumb({
      category: "navigation",
      message: `route: ${pathname}`,
      level: "info",
    });
  }, [pathname]);

  useEffect(() => {
    Sentry.setContext("app", {
      networkId,
      walletConnected: walletStatus === "connected",
    });
  }, [networkId, walletStatus]);

  return null;
}
