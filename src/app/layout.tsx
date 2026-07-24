import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { auth } from "@/auth";
import { AppFooter } from "@/components/layout/app-footer";
import { AppHeader } from "@/components/layout/app-header";
import { ScrollToTopOnPathnameChange } from "@/components/layout/scroll-to-top-on-pathname";
import { SessionProvider } from "@/components/auth/session-provider";
import { SignInSheetProvider } from "@/components/auth/sign-in-sheet";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { CatalogDebugPanel } from "@/components/dev/catalog-debug-panel";
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  const hasGoogle = Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);
  const hasDiscord = Boolean(process.env.AUTH_DISCORD_ID && process.env.AUTH_DISCORD_SECRET);
  const hasEmail = Boolean(process.env.AUTH_RESEND_KEY);

  return (
    <html
      lang="en"
      className={`dark ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col font-sans">
        <ThemeProvider>
          <SessionProvider session={session}>
            <SignInSheetProvider
              hasGoogle={hasGoogle}
              hasDiscord={hasDiscord}
              hasEmail={hasEmail}
            >
              <ScrollToTopOnPathnameChange />
              <AppHeader />
              <main className="flex-1 bg-background">{children}</main>
              <AppFooter />
              <CatalogDebugPanel />
            </SignInSheetProvider>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
