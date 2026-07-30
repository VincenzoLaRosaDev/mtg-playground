import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { auth } from "@/auth";
import { DeckInsightsPanel } from "@/components/decks/deck-insights-panel";
import { DeckTokensExtrasSection } from "@/components/decks/deck-tokens-extras-section";
import { PageShell } from "@/components/layout/page-shell";
import { PreconDeckView } from "@/components/precons/precon-deck-view";
import { PreconForkButton } from "@/components/precons/precon-fork-button";
import { prisma } from "@/lib/db";
import { getPreconBySlug } from "@/lib/precons/precons";
import { createPageMetadata } from "@/lib/seo/site";

export const dynamic = "force-dynamic";

type PreconDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: PreconDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const precon = await prisma.precon.findUnique({
    where: { slug },
    select: { name: true, slug: true, format: true },
  });
  if (!precon) {
    return createPageMetadata({
      title: "Precon",
      description: "Official Magic precon.",
      path: `/precons/${slug}`,
    });
  }
  return createPageMetadata({
    title: precon.name,
    description: `Official ${precon.format} precon — owned checklist and fork to deck.`,
    path: `/precons/${precon.slug}`,
  });
}

export default async function PreconDetailPage({ params }: PreconDetailPageProps) {
  const { slug } = await params;
  const session = await auth();
  const userId = session?.user?.id ?? null;
  const precon = await getPreconBySlug(prisma, slug, userId);
  if (!precon) notFound();

  const released = precon.releaseDate
    ? new Date(precon.releaseDate).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null;

  return (
    <PageShell
      title={precon.name}
      description={`${precon.formatLabel} · ${precon.type} · ${precon.code.toUpperCase()}${released ? ` · ${released}` : ""}`}
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Precons", href: "/precons" },
        { label: precon.name, href: `/precons/${precon.slug}` },
      ]}
      headerActions={
        <PreconForkButton
          preconId={precon.id}
          callbackUrl={`/precons/${precon.slug}`}
        />
      }
    >
      <div className="space-y-6">
        {userId ? (
          <p className="text-sm text-muted-foreground">
            Owned {precon.ownership.ownedCopies} · Missing{" "}
            {precon.ownership.missingCopies} (oracle totals vs your collection)
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Sign in to see owned / missing vs your collection and fork this list.
          </p>
        )}

        <PreconDeckView
          cards={precon.cards}
          showCommanderBoards={precon.showCommanderBoards}
          signedIn={Boolean(userId)}
        />

        <DeckInsightsPanel
          format={precon.format}
          heading="Precon stats"
          emptyMessage="Precon stats appear once the list has main-deck cards."
          insights={precon.stats.insights}
          composition={precon.stats.composition}
          curveBreakdowns={precon.stats.curveBreakdowns}
          quantityBreakdowns={precon.stats.quantityBreakdowns}
          cardNameQuantities={precon.stats.cardNameQuantities}
          coherence={precon.stats.coherence}
          estCost={precon.stats.estCost}
          manaPips={precon.stats.manaPips}
          manaProduction={precon.stats.manaProduction}
          manaProductionLandsOnly={precon.stats.manaProductionLandsOnly}
        />

        <DeckTokensExtrasSection
          tokensExtras={precon.tokensExtras}
          viewPreference="precon"
        />
      </div>
    </PageShell>
  );
}
