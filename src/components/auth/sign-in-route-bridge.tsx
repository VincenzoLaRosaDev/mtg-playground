"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

import { useSignInSheet } from "@/components/auth/sign-in-sheet";
import { Button } from "@/components/ui/button";

type SignInRouteBridgeProps = {
  callbackUrl: string;
  /** Sign-in was refused (allowlist). Show the reason instead of reopening the sheet. */
  denied?: boolean;
};

/**
 * `/signin` is where Auth.js sends OAuth redirects and errors (`pages.signIn`).
 * Normal case: open the sign-in sheet over this page. Denied case: explain, and
 * do NOT reopen the sheet — retrying with the same account cannot succeed.
 *
 * The page intentionally does not navigate away on its own: `/collection` and
 * other protected routes bounce signed-out users back here (see `middleware.ts`),
 * so redirecting to `callbackUrl` while signed out would loop.
 */
export function SignInRouteBridge({ callbackUrl, denied = false }: SignInRouteBridgeProps) {
  const { openSignIn } = useSignInSheet();
  const router = useRouter();
  const opened = useRef(false);

  useEffect(() => {
    if (denied || opened.current) return;
    opened.current = true;
    openSignIn({ callbackUrl });
  }, [callbackUrl, denied, openSignIn]);

  if (denied) {
    return (
      <div className="flex max-w-md flex-col items-start gap-4">
        <p className="text-sm text-muted-foreground">
          MTGPlayground is in closed beta and this Google account is not on the invite
          list yet. If you think this is a mistake, ask for your address to be added.
        </p>
        <Button type="button" variant="outline" onClick={() => router.push("/browse")}>
          Back to browse
        </Button>
      </div>
    );
  }

  return (
    <div className="flex max-w-md flex-col items-start gap-4">
      <p className="text-sm text-muted-foreground" aria-live="polite">
        Opening sign in…
      </p>
      <Button type="button" onClick={() => openSignIn({ callbackUrl })}>
        Sign in
      </Button>
    </div>
  );
}
