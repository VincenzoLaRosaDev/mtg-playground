import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { SignInRouteBridge } from "@/components/auth/sign-in-route-bridge";
import { PageShell } from "@/components/layout/page-shell";
import { createPageMetadata } from "@/lib/seo/site";

export const metadata: Metadata = createPageMetadata({
  title: "Sign in",
  description: "Sign in to MTGPlayground to manage your collection.",
  path: "/signin",
  noIndex: true,
});

type SignInPageProps = {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const session = await auth();
  const { callbackUrl, error } = await searchParams;
  const safeCallback =
    callbackUrl && callbackUrl.startsWith("/") && !callbackUrl.startsWith("//")
      ? callbackUrl
      : "/collection";

  if (session?.user) {
    redirect(safeCallback);
  }

  // Auth.js redirects here with `?error=AccessDenied` when `signIn` refuses.
  const denied = error === "AccessDenied";

  return (
    <PageShell
      title={denied ? "Account not enabled" : "Sign in"}
      description={
        denied
          ? "This account can't access MTGPlayground yet."
          : "Opening the sign-in dialog…"
      }
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Sign in", href: "/signin" },
      ]}
    >
      <SignInRouteBridge callbackUrl={safeCallback} denied={denied} />
    </PageShell>
  );
}
