"use client";

import type { ReactNode } from "react";
import { NetworkProvider } from "../../hooks/useNetwork";
import { NotificationProvider } from "../../hooks/useNotifications";
import { AnnounceProvider } from "../../hooks/useAnnounce";
import { CurrencyProvider } from "../../hooks/useCurrency";
import { MockApiProvider } from "./MockApiProvider";

/**
 * Client-side context providers shared across the app shell.
 * Kept in one place so the root layout can stay a server component.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <MockApiProvider>
      <NetworkProvider>
        <CurrencyProvider>
          <AnnounceProvider>
            <NotificationProvider>{children}</NotificationProvider>
          </AnnounceProvider>
        </CurrencyProvider>
      </NetworkProvider>
    </MockApiProvider>
  );
}
