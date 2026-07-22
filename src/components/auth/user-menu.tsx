"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";

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

/** Fixed footprint so Sign in ↔ account never shifts header chrome. */
const AUTH_SLOT_CLASS = "flex h-7 min-w-[5.75rem] items-center justify-end";

function accountInitial(name: string | null | undefined, email: string | null | undefined) {
  const source = name?.trim() || email?.trim() || "?";
  return source.charAt(0).toUpperCase();
}

export function UserMenu() {
  const { data: session, status } = useSession();

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
          render={<Link href="/signin" />}
          nativeButton={false}
          variant="outline"
          size="sm"
          className="min-w-[5.75rem]"
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
              className="cursor-pointer"
              onClick={() => {
                void signOut();
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
