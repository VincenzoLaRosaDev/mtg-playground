"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState, useTransition } from "react";

import { useSignInSheet } from "@/components/auth/sign-in-sheet";
import { Button } from "@/components/ui/button";
import { forkPrecon } from "@/lib/precons/actions";

type PreconForkButtonProps = {
  preconId: string;
  callbackUrl: string;
};

export function PreconForkButton({
  preconId,
  callbackUrl,
}: PreconForkButtonProps) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { openSignIn } = useSignInSheet();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleFork() {
    if (status === "loading") return;
    if (!session?.user) {
      openSignIn({ callbackUrl });
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await forkPrecon(preconId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push(`/decks/${result.deckId}`);
    });
  }

  return (
    <div className="space-y-2">
      <Button type="button" disabled={pending || status === "loading"} onClick={handleFork}>
        {session?.user ? "Fork to deck" : "Sign in to fork"}
      </Button>
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
