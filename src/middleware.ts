import NextAuth from "next-auth";
import { NextResponse } from "next/server";

import { authConfig } from "@/auth.config";

/**
 * Edge-safe auth: `authConfig` carries no Prisma adapter, and sessions are JWTs,
 * so the session can be read here without a database round-trip.
 *
 * This is a blanket guard so a new protected area can't ship unguarded by
 * accident — page-level `await auth()` checks stay in place as the real
 * authorization boundary (middleware never sees Server Action requests).
 */
const { auth } = NextAuth(authConfig);

/**
 * Page routes that require a signed-in user via middleware redirect.
 * `/collection` and `/decks` intentionally omit this — they use
 * `RequireAuthLink` + sign-in gates (sheet-only UX). See docs/DECISIONS.md.
 */
const PROTECTED_PAGES: string[] = [];

/** API routes that require a signed-in user (answer 401 instead of redirecting). */
const PROTECTED_APIS = ["/api/collection"];

function matches(pathname: string, prefixes: string[]): boolean {
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export default auth((req) => {
  if (req.auth?.user) {
    return;
  }

  const { pathname, search } = req.nextUrl;

  if (matches(pathname, PROTECTED_APIS)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (matches(pathname, PROTECTED_PAGES)) {
    const url = new URL("/signin", req.nextUrl);
    url.searchParams.set("callbackUrl", `${pathname}${search}`);
    return NextResponse.redirect(url);
  }
});

export const config = {
  matcher: ["/api/collection/:path*"],
};
