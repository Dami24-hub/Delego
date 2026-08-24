import type { Metadata } from "next";
import { StrictMode } from "react";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import "../styles/globals.css";
import { Sidebar } from "../components/layout/Sidebar";
import { Header } from "../components/layout/Header";
import { AppProviders } from "../components/providers/AppProviders";
import { AnnouncementBanner } from "../components/announcements/AnnouncementBanner";

export const metadata: Metadata = {
  title: {
    default: "Delego",
    template: "%s | Delego",
  },
  description: "Delegate shopping to AI agents with spending controls",
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
      <body>
        <StrictMode>
          <NextIntlClientProvider locale={locale} messages={messages}>
            <AppProviders>
              <div className="app-shell">
                <Sidebar />
                <div className="app-main">
                  <Header />
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
