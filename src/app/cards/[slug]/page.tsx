import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CardDetailLists } from "@/components/discovery/card-detail-lists";
import { CardDetailOverview } from "@/components/discovery/card-detail-overview";
import { CardDetailPrintingControls } from "@/components/discovery/card-detail-printing-controls";
import { EntityPreviewFooter } from "@/components/discovery/entity-preview-footer";
import { PageShell } from "@/components/layout/page-shell";
import { prisma } from "@/lib/db";
import {
  getBuildSkeleton,
  getCardClassification,
  getGameChangersInCi,
  getRoleStaplesInCi,
  getSimilarCards,
} from "@/lib/discovery/detail-pack";
import { findPlayableCardBySlug } from "@/lib/scryfall/catalog-filters";
import { getCardRelativesBySubtype } from "@/lib/scryfall/card-relatives";
import {
  buildCardVersionHref,
  listOraclePrintings,
  parsePrintingFinish,
  resolveActiveFinish,
  resolveCardDetailView,
  resolveCardPrinting,
} from "@/lib/scryfall/card-printing";
import {
  buildCardDetailNavItems,
  buildCommanderDetailNavItems,
} from "@/lib/ui/detail-section-nav";
import { createPageMetadata } from "@/lib/seo/site";

export const dynamic = "force-dynamic";

type CardDetailPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    set?: string;
    cn?: string;
    finish?: string;
    view?: string;
  }>;
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
    id: true,
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
    {
      catalogPrintingId: card.id,
      imageUri: card.imageUri,
      faces: card.faces,
      prices: card.prices,
    },
    { set: setCode, cn },
  );
  // Keep bare `/cards/{slug}` canonical when no version was requested.
  const path = setCode
    ? buildCardVersionHref(slug, {
        set: printing.setCode,
        cn: printing.collectorNumber,
        finish,
      })
    : `/cards/${slug}`;

  return createPageMetadata({
    title: card.name,
    description: `${card.name} — ${card.typeLine}. Inclusion rank, roles, and related cards from Scryfall.`,
    path,
    image: printing.imageUri,
  });
}

export default async function CardDetailPage({ params, searchParams }: CardDetailPageProps) {
  const { slug } = await params;
  const {
    set: setCodeParam,
    cn: cnParam,
    finish: finishParam,
    view: viewParam,
  } = await searchParams;
  const selectedFinish = parsePrintingFinish(finishParam);

  const card = await findPlayableCardBySlug(prisma, slug, cardSelect);

  if (!card) {
    notFound();
  }

  const activeView = resolveCardDetailView(card.isCommander, viewParam);

  const [printing, printings, classification, relativesResult] = await Promise.all([
    resolveCardPrinting(
      prisma,
      card.oracleId,
      {
        catalogPrintingId: card.id,
        imageUri: card.imageUri,
        faces: card.faces,
        prices: card.prices,
      },
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

  const [roleStaples, gameChangers, buildSkeleton] = card.isCommander
    ? await Promise.all([
        getRoleStaplesInCi(prisma, card.colorIdentity),
        getGameChangersInCi(prisma, card.colorIdentity),
        getBuildSkeleton(prisma, card.colorIdentity),
      ])
    : [[], [], []];

  const hasRelatives = subtypes.length > 0 && relatives.length > 0;
  const roleStapleNav = roleStaples
    .filter((group) => group.cards.length > 0)
    .map((group) => ({ role: group.role, label: group.label }));

  const sectionNavItems =
    activeView === "commander"
      ? buildCommanderDetailNavItems({
          roleStaples: roleStapleNav,
          hasGameChangers: gameChangers.length > 0,
          hasBuildSkeleton: buildSkeleton.length > 0,
        })
      : buildCardDetailNavItems({
          hasSimilarCards: similar.length > 0,
          hasRelatives,
        });

  const footerPrices = printing.prices ?? card.prices;
  const activeFinish = resolveActiveFinish(printing.finishes, selectedFinish);

  return (
    <PageShell
      title={card.name}
      description={card.typeLine}
      breadcrumbs={[
        { label: "Browse", href: "/browse" },
        { label: card.name, href: `/cards/${slug}` },
      ]}
    >
      <CardDetailOverview
        imageUri={printing.imageUri}
        faces={printing.faces}
        imageAlt={card.name}
        finish={activeFinish}
        setName={printing.setName}
        setCode={printing.setCode}
        collectorNumber={printing.collectorNumber}
        versionPicker={
          <CardDetailPrintingControls
            slug={slug}
            printings={printings}
            selectedSet={printing.setCode}
            selectedCn={printing.collectorNumber}
            selectedFinish={selectedFinish}
            view={activeView}
          />
        }
        previewFooter={
          <EntityPreviewFooter
            prices={footerPrices}
            preferredFinish={activeFinish}
            showInclusionRank={false}
            frictionScore={null}
            className="gap-x-3 gap-y-2 text-sm"
          />
        }
        popularityRank={card.popularityRank}
        frictionScore={card.frictionScore}
        isGameChanger={card.isGameChanger}
        isReserved={card.isReserved}
        isCommander={card.isCommander}
        classification={classification}
      />

      <CardDetailLists
        slug={slug}
        isCommander={card.isCommander}
        activeView={activeView}
        setCode={printing.setCode}
        collectorNumber={printing.collectorNumber}
        finish={activeFinish}
        sectionNavItems={sectionNavItems}
        similar={similar}
        subtypes={subtypes}
        relatives={relatives}
        roleStaples={roleStaples}
        gameChangers={gameChangers}
        buildSkeleton={buildSkeleton}
      />
    </PageShell>
  );
}
