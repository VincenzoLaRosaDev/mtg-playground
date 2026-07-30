"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";

import { useSignInSheet } from "@/components/auth/sign-in-sheet";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { isAuthRequiredHref } from "@/lib/navigation";

/** Fixed footprint so Sign in ↔ account never shifts header chrome. */
const AUTH_SLOT_CLASS = "flex h-7 min-w-[5.75rem] items-center justify-end";

function accountInitial(name: string | null | undefined, email: string | null | undefined) {
  const source = name?.trim() || email?.trim() || "?";
  return source.charAt(0).toUpperCase();
}

type UserMenuProps = {
  /** e.g. close the mobile nav sheet before opening sign-in. */
  onBeforeSignIn?: () => void;
};

export function UserMenu({ onBeforeSignIn }: UserMenuProps) {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const { openSignIn } = useSignInSheet();

  if (status === "loading") {
    return (
      <div className={AUTH_SLOT_CLASS}>
        <Button type="button" variant="outline" size="sm" disabled className="min-w-[5.75rem]">
          Sign in
        </Button>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className={AUTH_SLOT_CLASS}>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="min-w-[5.75rem]"
          onClick={() => {
            onBeforeSignIn?.();
            // Defer so the mobile nav sheet can close before this sheet opens.
            queueMicrotask(() => openSignIn());
          }}
        >
          Sign in
        </Button>
      </div>
    );
  }

  const label = session.user.name?.trim() || session.user.email || "Account";
  const initial = accountInitial(session.user.name, session.user.email);

  return (
    <div className={AUTH_SLOT_CLASS}>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              className="overflow-hidden rounded-full p-0"
              aria-label={`Account menu (${label})`}
            />
          }
        >
          {session.user.image ? (
            // OAuth avatar hosts vary; keep plain img over next/image remotePatterns.
            // eslint-disable-next-line @next/next/no-img-element -- external auth avatar
            <img
              src={session.user.image}
              alt=""
              className="size-full rounded-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <span className="text-xs font-semibold">{initial}</span>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-44">
          <DropdownMenuGroup>
            <DropdownMenuLabel className="truncate font-normal normal-case tracking-normal">
              {label}
            </DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem
              nativeButton={false}
              render={<Link href="/collection" />}
              className="cursor-pointer"
            >
              Collection
            </DropdownMenuItem>
            <DropdownMenuItem
              nativeButton={false}
              render={<Link href="/decks" />}
              className="cursor-pointer"
            >
              Decks
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => {
                // Leave account-only workspaces so SignInGate does not reopen the sheet.
                void signOut({
                  callbackUrl: isAuthRequiredHref(pathname) ? "/" : undefined,
                });
              }}
            >
              Sign out
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
