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

  return (
    <PageShell title="Sign in" description="Opening the sign-in dialog…">
      <SignInRouteBridge callbackUrl={safeCallback} />
    </PageShell>
  );
}
