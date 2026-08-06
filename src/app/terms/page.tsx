import type { Metadata } from "next";
import Link from "next/link";

import { PageShell } from "@/components/layout/page-shell";
import { createPageMetadata } from "@/lib/seo/site";

export const metadata: Metadata = createPageMetadata({
  title: "Terms of Service",
  description: "The terms for using MTGPlayground while it is in beta.",
  path: "/terms",
});

const CONTACT_EMAIL = "v.larosa.dev@gmail.com";

export default function TermsPage() {
  return (
    <PageShell
      title="Terms of Service"
      description="Last updated 2026-08-05."
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Terms", href: "/terms" },
      ]}
    >
      <div className="max-w-2xl space-y-8 text-sm leading-relaxed text-muted-foreground">
        <section className="space-y-2 rounded-lg border border-border bg-card p-4">
          <p>
            MTGPlayground is a personal, beta-stage project. These terms are a plain-language
            baseline for using it, not a substitute for formal legal counsel.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">The service</h2>
          <p>
            MTGPlayground provides a Magic: The Gathering card/set catalog, a personal
            collection tracker, and a multi-format deck builder. It is provided as-is, free
            of charge, with no uptime or availability guarantee.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Beta status</h2>
          <p>
            The product is in active development. Features, data models, and access (who can
            sign in) can change or be removed at any time without notice, including during
            the beta period. Account creation may be limited to an invite list.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Acceptable use</h2>
          <p>
            Don&apos;t attempt to scrape, bulk-extract, or abuse the catalog APIs beyond
            normal interactive use, attempt to bypass the beta access gate, or use the
            service for anything unlawful.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Card data &amp; intellectual property</h2>
          <p>
            Magic: The Gathering card names, text, and images are property of Wizards of the
            Coast. Card data is sourced from Scryfall and MTGJSON under their respective fan
            content terms; MTGPlayground does not claim ownership over this data and is not
            affiliated with Wizards of the Coast.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">No warranty, limitation of liability</h2>
          <p>
            The service is provided &quot;as is&quot; without warranties of any kind. To the
            extent permitted by law, the operator is not liable for any loss arising from use
            of the service, including data loss during the beta period.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Termination</h2>
          <p>
            Accounts may be suspended or removed for misuse, or as part of winding down or
            changing the beta. You can request deletion of your own account and data at any
            time (see the{" "}
            <Link
              href="/privacy"
              className="font-medium text-foreground/80 underline-offset-4 hover:text-primary hover:underline"
            >
              Privacy Policy
            </Link>
            ).
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Changes</h2>
          <p>These terms may change as the product evolves. Continued use after a change means you accept the updated terms.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Contact</h2>
          <p>
            Questions about these terms:{" "}
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
