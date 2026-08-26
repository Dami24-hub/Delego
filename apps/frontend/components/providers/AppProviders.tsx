"use client";

import { useEffect, type ReactNode } from "react";

import { NetworkProvider } from "../../hooks/useNetwork";
import { NotificationProvider } from "../../hooks/useNotifications";
import { AnnounceProvider } from "../../hooks/useAnnounce";
import { CurrencyProvider } from "../../hooks/useCurrency";
import { MockApiProvider } from "./MockApiProvider";
import { SentryBreadcrumbs } from "./SentryBreadcrumbs";
import { WebVitalsReporter } from "./WebVitalsReporter";
import { TourProvider } from "../tour/TourProvider";
import { initReplayEngine } from "../../lib/replayEngine";
import { QueueInspectorModal } from "../offline/QueueInspectorModal";

/**
 * Client-side context providers shared across the app shell.
 * Kept in one place so the root layout can stay a server component.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  useEffect(() => {
    return initReplayEngine();
  }, []);

  return (
    <MockApiProvider>
      <NetworkProvider>
        <CurrencyProvider>
          <AnnounceProvider>
            <NotificationProvider>
              <TourProvider>
                <SentryBreadcrumbs />
                <WebVitalsReporter />
                <QueueInspectorModal />
                {children}
              </TourProvider>
            </NotificationProvider>
          </AnnounceProvider>
        </CurrencyProvider>
      </NetworkProvider>
    </MockApiProvider>
  );
}

