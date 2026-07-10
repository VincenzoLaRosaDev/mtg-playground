import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { AppFooter } from "@/components/layout/app-footer";
import { AppHeader } from "@/components/layout/app-header";
import { CatalogDebugBadge } from "@/components/dev/catalog-debug-badge";
import { rootMetadata } from "@/lib/seo/site";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = rootMetadata;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <AppHeader />
        <main className="flex-1">{children}</main>
        <AppFooter />
        <CatalogDebugBadge />
      </body>
    </html>
  );
}
