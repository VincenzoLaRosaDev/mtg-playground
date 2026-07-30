"use client";

import { useEffect, useRef } from "react";

import { useSignInSheet } from "@/components/auth/sign-in-sheet";
import { Button } from "@/components/ui/button";
import { PageShell } from "@/components/layout/page-shell";

/** Unsigned `/decks` — open the sign-in sheet. */
export function DecksSignInGate({
  callbackUrl = "/decks",
}: {
  callbackUrl?: string;
}) {
  const { openSignIn } = useSignInSheet();
  const opened = useRef(false);

  useEffect(() => {
    if (opened.current) return;
    opened.current = true;
    openSignIn({ callbackUrl });
  }, [openSignIn, callbackUrl]);

  return (
    <PageShell
      title="Decks"
      description="Sign in to create and edit multi-format decks."
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Decks", href: "/decks" },
      ]}
    >
      <div className="flex max-w-md flex-col items-start gap-4">
        <p className="text-sm text-muted-foreground">
          Your decks are private. Sign in with Google, Discord, or a magic link
          to continue.
        </p>
        <Button
          type="button"
          onClick={() => openSignIn({ callbackUrl })}
        >
          Sign in
        </Button>
      </div>
    </PageShell>
  );
}
