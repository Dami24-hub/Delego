"use client";

import type { ReactNode } from "react";
import { NetworkProvider } from "../../hooks/useNetwork";
import { NotificationProvider } from "../../hooks/useNotifications";
import { AnnounceProvider } from "../../hooks/useAnnounce";

/**
 * Client-side context providers shared across the app shell.
 * Kept in one place so the root layout can stay a server component.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <NetworkProvider>
      <AnnounceProvider>
        <NotificationProvider>{children}</NotificationProvider>
      </AnnounceProvider>
    </NetworkProvider>
  );
}
