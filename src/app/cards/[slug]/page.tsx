import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CardDetailCardlistSections } from "@/components/discovery/card-detail-cardlist-sections";
import { DetailHeroAside } from "@/components/discovery/detail-hero-aside";
import { DetailSectionPanel } from "@/components/discovery/detail-section-panel";
import { CardRelativesBySubtype } from "@/components/discovery/card-relatives-by-subtype";
import { EdhrecSimilarCards } from "@/components/discovery/edhrec-similar-cards";
import { EdhrecTopCommanders } from "@/components/discovery/edhrec-top-commanders";
import { EntityDetailTabs } from "@/components/discovery/entity-detail-tabs";
import { PriceChip } from "@/components/discovery/price-chip";
import { StaleCacheBanner } from "@/components/discovery/stale-cache-banner";
import { PageShell } from "@/components/layout/page-shell";
import {
  getTopCommandersFromCardlists,
  parseCardDetailCardlists,
} from "@/lib/edhrec/cardlists";
import { getCardDetailEdhrecData } from "@/lib/edhrec/variant-cache";
import { prisma } from "@/lib/db";
import { findPlayableCardByEdhrecSlug } from "@/lib/scryfall/catalog-filters";
import { getCardRelativesBySubtype } from "@/lib/scryfall/card-relatives";
import { resolveCardHeroImage } from "@/lib/scryfall/card-printing";
import { CardStatsLine } from "@/components/discovery/card-stats-line";
import { ColorIdentity } from "@/components/mtg/color-identity";
import { buildCardDetailNavItems } from "@/lib/ui/detail-section-nav";
import { formatInclusionPercent } from "@/lib/display/formatters";
import { DETAIL_HERO_GRID_CLASS, DETAIL_MAIN_COLUMN_CLASS } from "@/lib/ui/layout";
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
  prices: true,
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

  const edhrecCard = await getCardDetailEdhrecData(slug, { warm: true });
  const cardlists = edhrecCard.data?.cardlists;
  const { subtypes, relatives } = await getCardRelativesBySubtype(card);

  const popularityInclusion = edhrecCard.data
    ? formatInclusionPercent(
        edhrecCard.data.inclusion,
        edhrecCard.data.potentialDecks,
        edhrecCard.data.numDecks,
      )
    : "—";

  const popularityParts = [
    popularityInclusion !== "—" ? `${popularityInclusion} inclusion` : null,
    edhrecCard.data?.numDecks != null
      ? `${edhrecCard.data.numDecks.toLocaleString()} decks`
      : null,
  ].filter(Boolean);

  const cardlistSections = cardlists ? parseCardDetailCardlists(cardlists) : [];
  const hasTopCommanders =
    cardlists != null && getTopCommandersFromCardlists(cardlists).length > 0;
  const hasSimilarCards = (edhrecCard.data?.similarCards.length ?? 0) > 0;
  const hasRelatives = subtypes.length > 0 && relatives.length > 0;
  const sectionNavItems = buildCardDetailNavItems({
    hasTopCommanders,
    cardlistSections,
    hasSimilarCards,
    hasRelatives,
  });

  return (
    <PageShell
      title={card.name}
      description={card.typeLine}
      breadcrumbs={[
        { label: "Top cards", href: "/cards" },
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

      <section className={DETAIL_HERO_GRID_CLASS}>
        <DetailHeroAside
          imageUri={hero.imageUri}
          imageAlt={card.name}
          setName={hero.setName}
          setCode={hero.setCode}
          salt={edhrecCard.data?.salt ?? null}
          sectionNavItems={sectionNavItems}
        />

        <div className={DETAIL_MAIN_COLUMN_CLASS}>
          <DetailSectionPanel title="Stats">
            <CardStatsLine
              cmc={card.cmc}
              colorIdentity={card.colorIdentity}
              isCommander={card.isCommander}
              className="mt-2"
            />
            <div className="mt-2">
              <PriceChip prices={card.prices} />
            </div>
          </DetailSectionPanel>

          {edhrecCard.data && (
            <DetailSectionPanel title="Popularity">
              <p className="mt-2 text-sm text-foreground">
                {popularityParts.length > 0
                  ? popularityParts.join(" · ")
                  : "Popularity stats unavailable"}
              </p>
            </DetailSectionPanel>
          )}

          <DetailSectionPanel title="Oracle text">
            <p className="mt-2 whitespace-pre-line text-sm leading-6 text-foreground">
              {card.oracleText ?? "No oracle text available."}
            </p>
          </DetailSectionPanel>

          <DetailSectionPanel title="Keywords">
            <p className="mt-2 text-sm text-muted-foreground">
              {card.keywords.length > 0 ? card.keywords.join(", ") : "None"}
            </p>
          </DetailSectionPanel>

          {edhrecCard.data && cardlists ? (
            <EdhrecTopCommanders cardlists={cardlists} />
          ) : (
            <DetailSectionPanel title="Top commanders">
              <p className="mt-2 text-sm text-muted-foreground">
                Popularity data for this card is not in the catalog yet.
              </p>
            </DetailSectionPanel>
          )}

          {cardlists ? (
            <CardDetailCardlistSections cardlists={cardlists} partition="unique" />
          ) : null}

          {edhrecCard.data?.similarCards.length ? (
            <EdhrecSimilarCards similarCards={edhrecCard.data.similarCards} />
          ) : null}

          <CardRelativesBySubtype subtypes={subtypes} relatives={relatives} />

          {cardlists ? (
            <CardDetailCardlistSections cardlists={cardlists} partition="shared" />
          ) : null}
        </div>
      </section>
    </PageShell>
  );
}
