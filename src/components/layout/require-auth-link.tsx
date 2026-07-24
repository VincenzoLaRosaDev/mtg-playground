"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import type { ComponentProps, MouseEvent, ReactNode } from "react";

import { useSignInSheet } from "@/components/auth/sign-in-sheet";

type RequireAuthLinkProps = {
  href: string;
  children: ReactNode;
  className?: string;
  /** Close another overlay (e.g. mobile nav) before opening sign-in. */
  onBeforeOpenSignIn?: () => void;
} & Omit<ComponentProps<typeof Link>, "href" | "onClick" | "children">;

/**
 * Link that opens the sign-in sheet when signed out instead of hitting `/signin`.
 * After auth, OAuth / magic link returns to `href`.
 */
export function RequireAuthLink({
  href,
  children,
  className,
  onBeforeOpenSignIn,
  ...props
}: RequireAuthLinkProps) {
  const { status } = useSession();
  const { openSignIn } = useSignInSheet();

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    // While session is resolving, allow navigation — `/collection` gates server-side.
    if (status === "authenticated" || status === "loading") return;
    event.preventDefault();
    onBeforeOpenSignIn?.();
    // Defer so a parent sheet (mobile nav) can close first.
    queueMicrotask(() => openSignIn({ callbackUrl: href }));
  }

  return (
    <Link href={href} className={className} onClick={handleClick} {...props}>
      {children}
    </Link>
  );
}
