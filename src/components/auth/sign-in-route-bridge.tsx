"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

import { useSignInSheet } from "@/components/auth/sign-in-sheet";

type SignInRouteBridgeProps = {
  callbackUrl: string;
};

/**
 * Auth.js still points `pages.signIn` at `/signin` for OAuth error redirects.
 * Bridge opens the sheet and leaves the dedicated sign-in page.
 */
export function SignInRouteBridge({ callbackUrl }: SignInRouteBridgeProps) {
  const { openSignIn } = useSignInSheet();
  const router = useRouter();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    openSignIn({ callbackUrl });
    router.replace(callbackUrl);
  }, [callbackUrl, openSignIn, router]);

  return (
    <p className="text-sm text-muted-foreground" aria-live="polite">
      Opening sign in…
    </p>
  );
}
