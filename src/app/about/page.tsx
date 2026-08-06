import type { Metadata } from "next";
import Link from "next/link";

import { PageShell } from "@/components/layout/page-shell";
import { createPageMetadata } from "@/lib/seo/site";

export const metadata: Metadata = createPageMetadata({
  title: "About",
  description: "What MTGPlayground is, who built it, and where the data comes from.",
  path: "/about",
});

export default function AboutPage() {
  return (
    <PageShell
      title="About MTGPlayground"
      description="A Magic: The Gathering catalog, personal collection, and multi-format deck builder."
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "About", href: "/about" },
      ]}
    >
      <div className="max-w-2xl space-y-8 text-sm leading-relaxed text-muted-foreground">
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">What this is</h2>
          <p>
            MTGPlayground is a printing-first Magic: The Gathering catalog paired with a
            personal collection tracker and a multi-format deck builder. Browse cards and
            sets, track exactly which printings and finishes you own, and build decks for
            Commander, Standard, Modern, and other constructed formats with live legality
            checks and owned/missing tracking against your own collection.
          </p>
          <p>
            The catalog is honest about what it shows: popularity numbers are Scryfall&apos;s
            Commander deck-inclusion rank (labeled <strong>EDH Inclusion</strong>), never
            presented as &quot;chosen as commander&quot; popularity. There is no scraped
            third-party meta data.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Current status: closed beta</h2>
          <p>
            MTGPlayground is in a limited beta. Catalog browsing is open to everyone;
            creating an account to track a collection or build decks may be restricted to
            an invite list while the product is validated. If sign-in doesn&apos;t work for
            your account yet, see the note on the sign-in screen for how to request access.
          </p>
          <p>
            Community features (publishing decks, ratings, rankings) are planned but not
            live yet — today the app is a personal toolkit, not a public deck-sharing
            platform.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Data &amp; attribution</h2>
          <p>
            Card data is provided by{" "}
            <a
              href="https://scryfall.com"
              className="font-medium text-foreground/80 underline-offset-4 hover:text-primary hover:underline"
            >
              Scryfall
            </a>{" "}
            and official precon decklists by{" "}
            <a
              href="https://mtgjson.com"
              className="font-medium text-foreground/80 underline-offset-4 hover:text-primary hover:underline"
            >
              MTGJSON
            </a>
            . MTGPlayground is not affiliated with, endorsed by, or sponsored by Wizards of
            the Coast.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Who built this</h2>
          <p>
            Created by{" "}
            <a
              href="https://vlarosa.dev"
              className="font-medium text-foreground/80 underline-offset-4 hover:text-primary hover:underline"
            >
              Vincenzo La Rosa
            </a>
            , as a personal project.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Contact</h2>
          <p>
            Questions, feedback, or a beta access request:{" "}
            <a
              href="mailto:v.larosa.dev@gmail.com"
              className="font-medium text-foreground/80 underline-offset-4 hover:text-primary hover:underline"
            >
              v.larosa.dev@gmail.com
            </a>
            . See also the{" "}
            <Link
              href="/privacy"
              className="font-medium text-foreground/80 underline-offset-4 hover:text-primary hover:underline"
            >
              Privacy Policy
            </Link>{" "}
            and{" "}
            <Link
              href="/terms"
              className="font-medium text-foreground/80 underline-offset-4 hover:text-primary hover:underline"
            >
              Terms of Service
            </Link>
            .
          </p>
        </section>
      </div>
    </PageShell>
  );
}
