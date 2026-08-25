import type { Metadata, Viewport } from "next";
import { StrictMode } from "react";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import "../styles/globals.css";
import { Sidebar } from "../components/layout/Sidebar";
import { Header } from "../components/layout/Header";
import { AppProviders } from "../components/providers/AppProviders";
import { AnnouncementBanner } from "../components/announcements/AnnouncementBanner";
import { ServiceWorkerRegistration } from "../components/pwa/ServiceWorkerRegistration";
import { InstallPromptCard } from "../components/pwa/InstallPromptCard";
import { themeBootstrapScript } from "../hooks/useTheme";

export const metadata: Metadata = {
  title: {
    default: "Delego",
    template: "%s | Delego",
  },
  description: "Delegate shopping to AI agents with spending controls",
  manifest: "/manifest.webmanifest",
  icons: {
    apple: "/icons/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Delego",
  },
};

/**
 * Two theme-color entries so the browser chrome / status bar tints match
 * light vs dark mode (#310) immediately via `prefers-color-scheme`, ahead of
 * ThemeToggle's JS-driven `data-theme` override running. Values mirror
 * `--color-bg-primary` in styles/globals.css.
 */
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f9fafb" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0f19" },
  ],
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale}>
      {/* Inline theme bootstrap: reads localStorage and sets data-theme before
          React hydrates, preventing a flash of the wrong theme (#639). */}
      {/* eslint-disable-next-line @next/next/no-before-interactive-script-outside-document */}
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrapScript }} />
      </head>
      <body>
        <StrictMode>
          <NextIntlClientProvider locale={locale} messages={messages}>
            <AppProviders>
              <ServiceWorkerRegistration />
              <div className="app-shell">
                <Sidebar />
                <div className="app-main">
                  <Header />
                  <InstallPromptCard />
                  <main className="app-content">{children}</main>
                </div>
              </div>
            </AppProviders>
          </NextIntlClientProvider>
        </StrictMode>
      </body>
    </html>
  );
}
