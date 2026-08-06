import type { Metadata } from "next";

import { PageShell } from "@/components/layout/page-shell";
import { createPageMetadata } from "@/lib/seo/site";

export const metadata: Metadata = createPageMetadata({
  title: "Privacy Policy",
  description: "What data MTGPlayground collects, why, and how to request its deletion.",
  path: "/privacy",
});

const CONTACT_EMAIL = "v.larosa.dev@gmail.com";

export default function PrivacyPage() {
  return (
    <PageShell
      title="Privacy Policy"
      description="Last updated 2026-08-05."
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Privacy", href: "/privacy" },
      ]}
    >
      <div className="max-w-2xl space-y-8 text-sm leading-relaxed text-muted-foreground">
        <section className="space-y-2 rounded-lg border border-border bg-card p-4">
          <p>
            MTGPlayground is a personal, beta-stage project, not a company. This notice is a
            plain-language summary of what data the app handles — it is not formal legal
            advice, and it will be revisited if the project moves beyond a closed beta.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">What we collect</h2>
          <p>Creating an account requires signing in with one of:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Google (OAuth) — we receive your email address and basic profile info from the provider.</li>
            <li>Email magic link (via Resend) — we receive the email address you sign in with.</li>
          </ul>
          <p>
            Once signed in, anything you add yourself is stored against your account: your
            card collection (which printings/finishes/quantities you own or wish for) and
            any decks you build (card lists, format, notes). Browsing the public catalog
            (cards, sets, precons) does not require an account and is not tied to you.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Why we collect it</h2>
          <p>
            Strictly to run the product: authenticating you, and storing your collection and
            decks so they persist between visits. Data is not used for advertising, is not
            sold, and is not shared with third parties beyond the processors listed below.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Where it&apos;s stored</h2>
          <p>
            Application data lives in a PostgreSQL database hosted by{" "}
            <a
              href="https://neon.tech"
              className="font-medium text-foreground/80 underline-offset-4 hover:text-primary hover:underline"
            >
              Neon
            </a>{" "}
            (EU region), on infrastructure hosted by{" "}
            <a
              href="https://vercel.com"
              className="font-medium text-foreground/80 underline-offset-4 hover:text-primary hover:underline"
            >
              Vercel
            </a>
            .
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Cookies &amp; tracking</h2>
          <p>
            MTGPlayground sets a session cookie to keep you signed in. There is no
            advertising, no analytics tracking, and no cross-site tracking today.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Third-party processors</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <a
                href="https://policies.google.com/privacy"
                className="font-medium text-foreground/80 underline-offset-4 hover:text-primary hover:underline"
              >
                Google
              </a>{" "}
              — OAuth sign-in.
            </li>
            <li>
              <a
                href="https://resend.com/legal/privacy-policy"
                className="font-medium text-foreground/80 underline-offset-4 hover:text-primary hover:underline"
              >
                Resend
              </a>{" "}
              — sends magic-link sign-in emails (optional).
            </li>
            <li>
              <a
                href="https://scryfall.com/privacy"
                className="font-medium text-foreground/80 underline-offset-4 hover:text-primary hover:underline"
              >
                Scryfall
              </a>{" "}
              and{" "}
              <a
                href="https://mtgjson.com"
                className="font-medium text-foreground/80 underline-offset-4 hover:text-primary hover:underline"
              >
                MTGJSON
              </a>{" "}
              — source the public card/set/precon catalog; no personal data is sent to them.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Your rights</h2>
          <p>
            You can ask to have your account and all associated data (collection, decks)
            deleted at any time by emailing{" "}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="font-medium text-foreground/80 underline-offset-4 hover:text-primary hover:underline"
            >
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        </section>
      </div>
    </PageShell>
  );
}
