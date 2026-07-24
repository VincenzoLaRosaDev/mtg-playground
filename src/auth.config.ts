import type { NextAuthConfig } from "next-auth";
import Discord from "next-auth/providers/discord";
import Google from "next-auth/providers/google";
import Resend from "next-auth/providers/resend";
import type { Provider } from "next-auth/providers";

import { isEmailAllowed } from "@/lib/auth/allowlist";

function buildProviders(): Provider[] {
  const providers: Provider[] = [];

  if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
    providers.push(
      Google({
        clientId: process.env.AUTH_GOOGLE_ID,
        clientSecret: process.env.AUTH_GOOGLE_SECRET,
      }),
    );
  }

  if (process.env.AUTH_DISCORD_ID && process.env.AUTH_DISCORD_SECRET) {
    providers.push(
      Discord({
        clientId: process.env.AUTH_DISCORD_ID,
        clientSecret: process.env.AUTH_DISCORD_SECRET,
      }),
    );
  }

  if (process.env.AUTH_RESEND_KEY) {
    providers.push(
      Resend({
        apiKey: process.env.AUTH_RESEND_KEY,
        from: process.env.AUTH_RESEND_FROM ?? "MTGPlayground <onboarding@resend.dev>",
      }),
    );
  }

  return providers;
}

/**
 * Edge-safe Auth.js config (no Prisma). Full Node config with adapter lives in `src/auth.ts`.
 */
export const authConfig = {
  providers: buildProviders(),
  pages: {
    signIn: "/signin",
  },
  session: { strategy: "jwt" },
  trustHost: true,
  callbacks: {
    /**
     * Closed-beta gate. Runs before the Prisma adapter persists the user, so a
     * rejected address leaves no row behind. Google's "Testing" mode is NOT a
     * gate for `openid`/`email`/`profile` apps — see `lib/auth/allowlist`.
     */
    signIn({ user }) {
      if (isEmailAllowed(user.email)) {
        return true;
      }

      return "/signin?error=AccessDenied";
    },
    jwt({ token, user }) {
      if (user?.id) {
        token.sub = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
