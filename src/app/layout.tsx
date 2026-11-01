import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { FxLayer } from "@/components/fx/FxLayer";
import { appUrl } from "@/lib/urls";
import { fontVars } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl()),
  title: { default: "MARVEL.WTF — Build your identity.", template: "%s" },
  description: "Build a superhero-grade personal identity. Claim your username and your own page on MARVEL.WTF.",
  openGraph: { siteName: "MARVEL.WTF", type: "website" },
  twitter: { card: "summary" },
};

export const viewport: Viewport = { themeColor: "#07070b", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={fontVars}>
      <body>
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[10000] focus:rounded focus:bg-spark focus:px-3 focus:py-2 focus:font-bold focus:text-black">Skip to content</a>
        {children}
        <FxLayer />
      </body>
    </html>
  );
}
