import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CardDetailListsDeferred } from "@/components/discovery/card-detail-lists-deferred";
import { CardDetailOverview } from "@/components/discovery/card-detail-overview";
import { CardDetailPrintingControls } from "@/components/discovery/card-detail-printing-controls";
import { EntityPreviewFooter } from "@/components/discovery/entity-preview-footer";
import { CardCollectionPanel } from "@/components/collection/card-collection-panel";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { auth } from "@/auth";
import {
  listOracleCollectionSummary,
  toOracleCollectionSnapshot,
} from "@/lib/collection/oracle-collection";
import { prisma } from "@/lib/db";
import { getCardClassification } from "@/lib/discovery/detail-pack";
import { findPlayableCardBySlug } from "@/lib/scryfall/catalog-filters";
import {
  buildCardVersionHref,
  parsePrintingFinish,
  resolveActiveFinish,
  resolveCardDetailView,
  resolveCardPrinting,
  resolveOraclePrintingOption,
} from "@/lib/scryfall/card-printing";
import { parseCardFaces } from "@/lib/scryfall/faces";
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
  });

  if (!card) {
    return createPageMetadata({
      title: "Card not found",
      description: "The requested card could not be found.",
      path: `/cards/${slug}`,
      noIndex: true,
    });
  }

  // Avoid full resolveCardPrinting when no version requested — catalog imageUri is enough for OG.
  let image = card.imageUri;
  let path = `/cards/${slug}`;
  if (setCode) {
    const printing = await resolveCardPrinting(
      prisma,
      card.oracleId,
      {
        catalogPrintingId: card.id,
        imageUri: card.imageUri,
        faces: null,
        prices: null,
      },
      { set: setCode, cn },
    );
    image = printing.imageUri;
    path = buildCardVersionHref(slug, {
      set: printing.setCode,
      cn: printing.collectorNumber,
      finish,
    });
  }

  return createPageMetadata({
    title: card.name,
    description: `${card.name} — ${card.typeLine}. EDH Inclusion rank, roles, and related cards from Scryfall.`,
    path,
    image,
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

  // Hero-critical + collection in parallel — lists stream after (no skeleton).
  const collectionSummaryPromise = auth().then(async (session) => {
    if (!session?.user?.id) return null;
    return listOracleCollectionSummary(prisma, session.user.id, card.oracleId);
  });

  const [activePrintingOption, printingCount, classification, collectionSummary] =
    await Promise.all([
      resolveOraclePrintingOption(prisma, card.oracleId, {
        initialSet: setCodeParam,
        initialCn: cnParam,
        catalogPrintingId: card.id,
        catalogImageUri: card.imageUri,
      }),
      prisma.printing.count({ where: { oracleId: card.oracleId } }),
      getCardClassification(prisma, card.oracleId),
      collectionSummaryPromise,
    ]);

  const seedPrintings = activePrintingOption ? [activePrintingOption] : [];
  const printingsLoaded = printingCount <= 1;
  const printingFaces = activePrintingOption?.faces?.length
    ? activePrintingOption.faces
    : parseCardFaces(card.faces);
  const printing = {
    imageUri: activePrintingOption?.imageUri ?? card.imageUri,
    faces: printingFaces,
    prices: activePrintingOption?.prices ?? card.prices,
    finishes: activePrintingOption?.finishes ?? [],
    setCode: activePrintingOption?.setCode ?? null,
    setName: activePrintingOption?.setName ?? null,
    collectorNumber: activePrintingOption?.collectorNumber ?? null,
    printingId: activePrintingOption?.id ?? null,
  };

  const footerPrices = printing.prices ?? card.prices;
  const activeFinish = resolveActiveFinish(printing.finishes, selectedFinish);

  const collectionSnapshot =
    collectionSummary != null
      ? toOracleCollectionSnapshot(
          collectionSummary,
          printing.printingId,
          activeFinish,
        )
      : null;
  return (
    <PageShell
      title={card.name}
      description={card.typeLine}
      breadcrumbs={[
        { label: "Browse", href: "/browse" },
        { label: card.name, href: `/cards/${slug}` },
      ]}
      headerActions={
        printing.setCode ? (
          <Button
            variant="outline"
            size="sm"
            className="shrink-0"
            nativeButton={false}
            render={<Link href={`/sets/${printing.setCode}`} />}
          >
            Go to set
          </Button>
        ) : null
      }
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
            oracleId={card.oracleId}
            seedPrintings={seedPrintings}
            printingCount={printingCount}
            printingsLoaded={printingsLoaded}
            selectedSet={printing.setCode}
            selectedCn={printing.collectorNumber}
            selectedFinish={selectedFinish}
            view={activeView}
          />
        }
        collectionAction={
          <CardCollectionPanel
            slug={slug}
            printingId={printing.printingId}
            finish={activeFinish}
            snapshot={collectionSnapshot}
          />
        }
        previewFooter={
          <EntityPreviewFooter
            prices={footerPrices}
            preferredFinish={activeFinish}
            showInclusionRank={false}
            className="gap-x-3 gap-y-2 text-sm"
          />
        }
        popularityRank={card.popularityRank}
        isGameChanger={card.isGameChanger}
        isReserved={card.isReserved}
        isCommander={card.isCommander}
        classification={classification}
      />

      <CardDetailListsDeferred
        slug={slug}
        cardId={card.id}
        oracleId={card.oracleId}
        typeLine={card.typeLine}
        isCommander={card.isCommander}
        colorIdentity={card.colorIdentity}
        themes={classification?.themes ?? []}
        activeView={activeView}
        setCode={printing.setCode}
        collectorNumber={printing.collectorNumber}
        finish={activeFinish}
      />
    </PageShell>
  );
}
