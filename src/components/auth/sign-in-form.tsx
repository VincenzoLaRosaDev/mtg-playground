"use client";

import { useState, useTransition } from "react";

import { signIn } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type SignInFormProps = {
  callbackUrl: string;
  hasGoogle: boolean;
  hasDiscord: boolean;
  hasEmail: boolean;
};

export function SignInForm({
  callbackUrl,
  hasGoogle,
  hasDiscord,
  hasEmail,
}: SignInFormProps) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const noProviders = !hasGoogle && !hasDiscord && !hasEmail;

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-4">
      {noProviders ? (
        <p className="text-sm text-muted-foreground">
          No sign-in providers are configured. Add OAuth and/or{" "}
          <code className="text-xs">AUTH_RESEND_KEY</code> in{" "}
          <code className="text-xs">.env.local</code>.
        </p>
      ) : null}

      {hasGoogle ? (
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={() =>
            startTransition(() => {
              void signIn("google", { callbackUrl });
            })
          }
        >
          Continue with Google
        </Button>
      ) : null}

      {hasDiscord ? (
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={() =>
            startTransition(() => {
              void signIn("discord", { callbackUrl });
            })
          }
        >
          Continue with Discord
        </Button>
      ) : null}

      {hasEmail ? (
        <form
          className="space-y-3 border-t border-border pt-4"
          onSubmit={(event) => {
            event.preventDefault();
            setMessage(null);
            startTransition(() => {
              void signIn("resend", { email, callbackUrl }).then(() => {
                setMessage("Check your email for a magic link.");
              });
            });
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <Button type="submit" className="w-full" disabled={pending || !email.trim()}>
            Email me a magic link
          </Button>
        </form>
      ) : (
        <p className="text-xs text-muted-foreground">
          Magic link sign-in is disabled until Resend is configured (
          <code>AUTH_RESEND_KEY</code>).
        </p>
      )}

      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
    </div>
  );
}
