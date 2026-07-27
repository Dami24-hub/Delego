import type { Metadata } from "next";
import { HomeContent } from "../components/HomeContent";

export const metadata: Metadata = {
  title: "Delego - AI-Powered Delegated Commerce on Stellar",
  description:
    "Delegate shopping to AI agents with spending controls on the Stellar network.",
  openGraph: {
    title: "Delego - AI-Powered Delegated Commerce on Stellar",
    description:
      "Delegate shopping to AI agents with spending controls on the Stellar network.",
    url: "https://delego.app",
    siteName: "Delego",
    images: [
      {
        url: "/og-default.png",
        width: 1200,
        height: 630,
        alt: "Delego - AI-Powered Delegated Commerce on Stellar",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Delego - AI-Powered Delegated Commerce on Stellar",
    description:
      "Delegate shopping to AI agents with spending controls on the Stellar network.",
    images: ["/og-default.png"],
  },
};

export default function HomePage() {
  return <HomeContent />;
}
