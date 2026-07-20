import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ClassificationBadges } from "@/components/discovery/classification-badges";
import { DetailCardGridSection } from "@/components/discovery/detail-card-grid-section";
import { DetailHeroAside } from "@/components/discovery/detail-hero-aside";
import { DetailHeroMeta } from "@/components/discovery/detail-hero-meta";
import { DetailSectionJump } from "@/components/discovery/detail-section-jump";
import { CardRelativesBySubtype } from "@/components/discovery/card-relatives-by-subtype";
import { EntityPreviewFooter } from "@/components/discovery/entity-preview-footer";
import { VersionPicker } from "@/components/discovery/version-picker";
import { PageShell } from "@/components/layout/page-shell";
import { prisma } from "@/lib/db";
import {
  getCardClassification,
  getSimilarCards,
} from "@/lib/discovery/detail-pack";
import { findPlayableCardBySlug } from "@/lib/scryfall/catalog-filters";
import { getCardRelativesBySubtype } from "@/lib/scryfall/card-relatives";
import {
  buildCardVersionHref,
  listOraclePrintings,
  parsePrintingFinish,
  resolveCardPrinting,
} from "@/lib/scryfall/card-printing";
import {
  buildCardDetailNavItems,
  DETAIL_SECTION_IDS,
} from "@/lib/ui/detail-section-nav";
import { DETAIL_HERO_GRID_CLASS, DETAIL_MAIN_COLUMN_CLASS } from "@/lib/ui/layout";
import { createPageMetadata } from "@/lib/seo/site";

export const dynamic = "force-dynamic";

type CardDetailPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ set?: string; cn?: string; finish?: string }>;
};

const cardSelect = {
  id: true,
  oracleId: true,
  name: true,
  slug: true,
  typeLine: true,
  imageUri: true,
  faces: true,
  isCommander: true,
  colorIdentity: true,
  prices: true,
  popularityRank: true,
  frictionScore: true,
  isGameChanger: true,
  isReserved: true,
} as const;

export async function generateMetadata({
  params,
  searchParams,
}: CardDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const { set: setCode, cn, finish } = await searchParams;

  const card = await findPlayableCardBySlug(prisma, slug, {
    oracleId: true,
    name: true,
    typeLine: true,
    imageUri: true,
    faces: true,
    prices: true,
  });

  if (!card) {
    return createPageMetadata({
      title: "Card not found",
      description: "The requested card could not be found.",
      path: `/cards/${slug}`,
      noIndex: true,
    });
  }

  const printing = await resolveCardPrinting(
    prisma,
    card.oracleId,
    { imageUri: card.imageUri, faces: card.faces, prices: card.prices },
    { set: setCode, cn },
  );
  const path = buildCardVersionHref(slug, {
    set: printing.setCode,
    cn: printing.collectorNumber,
    finish,
  });

  return createPageMetadata({
    title: card.name,
    description: `${card.name} — ${card.typeLine}. Inclusion rank, roles, and related cards from Scryfall.`,
    path,
    image: printing.imageUri,
  });
}

export default async function CardDetailPage({ params, searchParams }: CardDetailPageProps) {
  const { slug } = await params;
  const { set: setCodeParam, cn: cnParam, finish: finishParam } = await searchParams;
  const selectedFinish = parsePrintingFinish(finishParam);

  const card = await findPlayableCardBySlug(prisma, slug, cardSelect);

  if (!card) {
    notFound();
  }

  const [printing, printings, classification, relativesResult] = await Promise.all([
    resolveCardPrinting(
      prisma,
      card.oracleId,
      { imageUri: card.imageUri, faces: card.faces, prices: card.prices },
      { set: setCodeParam, cn: cnParam },
    ),
    listOraclePrintings(prisma, card.oracleId),
    getCardClassification(prisma, card.oracleId),
    getCardRelativesBySubtype(card),
  ]);

  const { subtypes, relatives } = relativesResult;

  const similar = await getSimilarCards(prisma, {
    oracleId: card.oracleId,
    colorIdentity: card.colorIdentity,
    themes: classification?.themes ?? [],
  });

  const hasRelatives = subtypes.length > 0 && relatives.length > 0;
  const sectionNavItems = buildCardDetailNavItems({
    hasSimilarCards: similar.length > 0,
    hasRelatives,
  });

  const footerPrices = printing.prices ?? card.prices;

  return (
    <PageShell
      title={card.name}
      description={card.typeLine}
      breadcrumbs={[
        { label: "Browse", href: "/browse" },
        { label: card.name, href: `/cards/${slug}` },
      ]}
    >
      <section className={DETAIL_HERO_GRID_CLASS}>
        <DetailHeroAside
          imageUri={printing.imageUri}
          faces={printing.faces}
          imageAlt={card.name}
          setName={printing.setName}
          setCode={printing.setCode}
          collectorNumber={printing.collectorNumber}
          versionPicker={
            <VersionPicker
              slug={slug}
              printings={printings}
              selectedSet={printing.setCode}
              selectedCn={printing.collectorNumber}
              selectedFinish={selectedFinish}
            />
          }
          previewFooter={
            <EntityPreviewFooter
              prices={footerPrices}
              preferredFinish={selectedFinish}
              popularityRank={card.popularityRank}
              frictionScore={card.frictionScore}
            />
          }
          sectionNavItems={sectionNavItems}
        />

        <div className={DETAIL_MAIN_COLUMN_CLASS}>
          <DetailHeroMeta
            popularityRank={card.popularityRank}
            frictionScore={card.frictionScore}
            isGameChanger={card.isGameChanger}
            isReserved={card.isReserved}
            isCommander={card.isCommander}
          />
          <div className="mt-4">
            <ClassificationBadges classification={classification} />
          </div>

          <DetailSectionJump items={sectionNavItems} />

          <div className="mt-6 space-y-6">
            {similar.length > 0 ? (
              <DetailCardGridSection
                id={DETAIL_SECTION_IDS.similarCards}
                title="Similar cards"
                cards={similar}
              />
            ) : null}
            <CardRelativesBySubtype subtypes={subtypes} relatives={relatives} />
          </div>
        </div>
      </section>
    </PageShell>
  );
}
