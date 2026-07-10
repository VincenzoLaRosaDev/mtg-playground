import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CardImage } from "@/components/discovery/card-image";
import { CardRelativesBySubtype } from "@/components/discovery/card-relatives-by-subtype";
import { EdhrecTopCommanders } from "@/components/discovery/edhrec-top-commanders";
import { EntityDetailTabs } from "@/components/discovery/entity-detail-tabs";
import { StaleCacheBanner } from "@/components/discovery/stale-cache-banner";
import { PageShell } from "@/components/layout/page-shell";
import { getCachedCardData } from "@/lib/edhrec/cache";
import type { EdhrecCardList } from "@/lib/edhrec/types";
import { prisma } from "@/lib/db";
import { findPlayableCardByEdhrecSlug } from "@/lib/scryfall/catalog-filters";
import { getCardRelativesBySubtype } from "@/lib/scryfall/card-relatives";
import { resolveCardHeroImage } from "@/lib/scryfall/card-printing";
import { formatColorIdentity } from "@/lib/display/formatters";
import { createPageMetadata } from "@/lib/seo/site";

type CardDetailPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ set?: string }>;
};

const cardSelect = {
  id: true,
  oracleId: true,
  name: true,
  edhrecSlug: true,
  typeLine: true,
  cmc: true,
  colorIdentity: true,
  oracleText: true,
  keywords: true,
  imageUri: true,
  isCommander: true,
} as const;

export async function generateMetadata({
  params,
  searchParams,
}: CardDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const { set: setCode } = await searchParams;

  const card = await findPlayableCardByEdhrecSlug(prisma, slug, {
    oracleId: true,
    name: true,
    typeLine: true,
    imageUri: true,
  });

  if (!card) {
    return createPageMetadata({
      title: "Card not found",
      description: "The requested card could not be found.",
      path: `/cards/${slug}`,
      noIndex: true,
    });
  }

  const hero = await resolveCardHeroImage(prisma, card.oracleId, card.imageUri, setCode);
  const path = setCode ? `/cards/${slug}?set=${setCode.toLowerCase()}` : `/cards/${slug}`;

  return createPageMetadata({
    title: card.name,
    description: `${card.name} — ${card.typeLine}. Card details, popularity stats, and related cards.`,
    path,
    image: hero.imageUri,
  });
}

export default async function CardDetailPage({ params, searchParams }: CardDetailPageProps) {
  const { slug } = await params;
  const { set: setCodeParam } = await searchParams;

  const card = await findPlayableCardByEdhrecSlug(prisma, slug, cardSelect);

  if (!card) {
    notFound();
  }

  const hero = await resolveCardHeroImage(
    prisma,
    card.oracleId,
    card.imageUri,
    setCodeParam,
  );

  const edhrecCard = await getCachedCardData(slug, { warm: true });
  const cardlists = (edhrecCard.data?.cardlists ?? {}) as Record<string, EdhrecCardList>;
  const { subtypes, relatives } = await getCardRelativesBySubtype(card);

  return (
    <PageShell
      title={card.name}
      description={card.typeLine}
      breadcrumbs={[
        { label: "Cards", href: "/cards" },
        { label: card.name, href: `/cards/${slug}` },
      ]}
    >
      {edhrecCard.isStale && edhrecCard.syncedAt && (
        <div className="mb-6">
          <StaleCacheBanner syncedAt={edhrecCard.syncedAt} context="page" />
        </div>
      )}

      {card.isCommander && (
        <EntityDetailTabs slug={slug} activeRoute="card" setCode={setCodeParam} />
      )}

      <section className="grid gap-6 md:grid-cols-[260px_1fr]">
        <div>
          {hero.imageUri ? (
            <CardImage src={hero.imageUri} alt={card.name} variant="detail" />
          ) : (
            <div className="flex aspect-[488/680] w-full max-w-[260px] items-center justify-center rounded-lg border border-zinc-200 bg-zinc-100 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
              No image available
            </div>
          )}
          {hero.setName && hero.setCode && (
            <p className="mt-2 max-w-[260px] text-xs text-zinc-500">
              Showing {hero.setName} ({hero.setCode.toUpperCase()}) printing
            </p>
          )}
        </div>

        <div className="space-y-5">
          <section className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
              Stats
            </h2>
            <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">
              CMC {card.cmc} · {formatColorIdentity(card.colorIdentity)}
              {card.isCommander ? " · Commander" : ""}
              {edhrecCard.data?.salt != null ? ` · Salt ${edhrecCard.data.salt.toFixed(2)}` : ""}
            </p>
          </section>

          <section className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
              Oracle text
            </h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-6 text-zinc-800 dark:text-zinc-200">
              {card.oracleText ?? "No oracle text available."}
            </p>
          </section>

          <section className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
              Keywords
            </h2>
            <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">
              {card.keywords.length > 0 ? card.keywords.join(", ") : "None"}
            </p>
          </section>

          {edhrecCard.data ? (
            <EdhrecTopCommanders cardlists={cardlists} />
          ) : (
            <section className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
                Top commanders
              </h2>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                Popularity data for this card is not in the catalog yet.
              </p>
            </section>
          )}

          <CardRelativesBySubtype subtypes={subtypes} relatives={relatives} />
        </div>
      </section>
    </PageShell>
  );
}
