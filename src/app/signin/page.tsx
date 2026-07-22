import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { SignInForm } from "@/components/auth/sign-in-form";
import { PageShell } from "@/components/layout/page-shell";
import { createPageMetadata } from "@/lib/seo/site";

export const metadata: Metadata = createPageMetadata({
  title: "Sign in",
  description: "Sign in to MTGPlayground to manage your collection.",
  path: "/signin",
  noIndex: true,
});

type SignInPageProps = {
  searchParams: Promise<{ callbackUrl?: string }>;
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const session = await auth();
  const { callbackUrl } = await searchParams;
  const safeCallback =
    callbackUrl && callbackUrl.startsWith("/") && !callbackUrl.startsWith("//")
      ? callbackUrl
      : "/collection";

  if (session?.user) {
    redirect(safeCallback);
  }

  const hasGoogle = Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);
  const hasDiscord = Boolean(process.env.AUTH_DISCORD_ID && process.env.AUTH_DISCORD_SECRET);
  const hasEmail = Boolean(process.env.AUTH_RESEND_KEY);

  return (
    <PageShell
      title="Sign in"
      description="Use Google, Discord, or a magic link to access your collection."
    >
      <SignInForm
        callbackUrl={safeCallback}
        hasGoogle={hasGoogle}
        hasDiscord={hasDiscord}
        hasEmail={hasEmail}
      />
    </PageShell>
  );
}
