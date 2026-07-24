"use client";

import { useEffect, useRef } from "react";

import { useSignInSheet } from "@/components/auth/sign-in-sheet";
import { Button } from "@/components/ui/button";
import { PageShell } from "@/components/layout/page-shell";

const COLLECTION_CALLBACK = "/collection";

/** Unsigned `/collection` — open the sign-in sheet (no `/signin` page). */
export function CollectionSignInGate() {
  const { openSignIn } = useSignInSheet();
  const opened = useRef(false);

  useEffect(() => {
    if (opened.current) return;
    opened.current = true;
    openSignIn({ callbackUrl: COLLECTION_CALLBACK });
  }, [openSignIn]);

  return (
    <PageShell
      title="Collection"
      description="Sign in to manage your printing-level inventory and wish list."
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Collection", href: "/collection" },
      ]}
    >
      <div className="flex max-w-md flex-col items-start gap-4">
        <p className="text-sm text-muted-foreground">
          Your collection is private. Sign in with Google, Discord, or a magic
          link to continue.
        </p>
        <Button
          type="button"
          onClick={() => openSignIn({ callbackUrl: COLLECTION_CALLBACK })}
        >
          Sign in
        </Button>
      </div>
    </PageShell>
  );
}
