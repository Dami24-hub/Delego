import type { Metadata } from "next";
import "../styles/globals.css";
import { Sidebar } from "../components/layout/Sidebar";
import { Header } from "../components/layout/Header";

export const metadata: Metadata = {
  title: "Delego",
  description: "Delegate shopping to AI agents with spending controls",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="app-shell">
          <Sidebar />
          <div className="app-main">
            <Header />
            <main className="app-content">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
