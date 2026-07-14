import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { CardFaceTile } from "@/components/discovery/card-face-tile";
import { EmptyState } from "@/components/discovery/empty-state";
import { SetCardFilters } from "@/components/discovery/set-card-filters";
import { PageListMeta } from "@/components/layout/page-list-meta";
import { PageShell } from "@/components/layout/page-shell";
import { prisma } from "@/lib/db";
import {
  buildSetCardWhere,
  formatReleaseDate,
  formatSetType,
  parseSetCardFilters,
  resolvedSetCardOrder,
  resolvedSetCardSort,
} from "@/lib/scryfall/sets";
import { hasActiveSetCardFilters } from "@/lib/scryfall/set-card-search-params";
import { sortSetCards } from "@/lib/scryfall/set-card-sort";
import { buildSetCatalogCardWhere } from "@/lib/scryfall/set-catalog-filters";
import { ColorIdentity } from "@/components/mtg/color-identity";
import { RarityIcon } from "@/components/mtg/rarity-icon";
import { createPageMetadata } from "@/lib/seo/site";
import { CARD_FACE_GRID_CLASS } from "@/lib/ui/card-face";

type SetDetailPageProps = {
  params: Promise<{ code: string }>;
  searchParams: Promise<{
    q?: string;
    rarity?: string;
    color?: string;
    commander?: string;
    type?: string;
    cmc_min?: string;
    cmc_max?: string;
    sort?: string;
    order?: string;
  }>;
};

export async function generateMetadata({ params }: SetDetailPageProps): Promise<Metadata> {
  const { code } = await params;
  const setCode = code.toLowerCase();

  const mtgSet = await prisma.mtgSet.findUnique({
    where: { code: setCode },
    select: { name: true, setType: true, cardCount: true },
  });

  if (!mtgSet) {
    return createPageMetadata({
      title: "Set not found",
      description: "The requested Magic set could not be found.",
      path: `/sets/${setCode}`,
      noIndex: true,
    });
  }

  return createPageMetadata({
    title: mtgSet.name,
    description: `${mtgSet.name} (${setCode.toUpperCase()}) — browse ${mtgSet.cardCount.toLocaleString()} cards with Commander filters.`,
    path: `/sets/${setCode}`,
  });
}

export default async function SetDetailPage({ params, searchParams }: SetDetailPageProps) {
  const { code } = await params;
  const setCode = code.toLowerCase();
  const filters = parseSetCardFilters(await searchParams);

  const mtgSet = await prisma.mtgSet.findUnique({
    where: { code: setCode },
    select: {
      code: true,
      name: true,
      releasedAt: true,
      setType: true,
      cardCount: true,
      iconUri: true,
      digital: true,
    },
  });

  if (!mtgSet) {
    notFound();
  }

  let matchingOracleIds: string[] | undefined;

  if (
    filters.colors?.length ||
    filters.commanderLegal ||
    filters.typeContains ||
    filters.cmcMin != null ||
    filters.cmcMax != null
  ) {
    const cardMatches = await prisma.card.findMany({
      where: buildSetCatalogCardWhere(filters),
      select: { oracleId: true },
    });

    matchingOracleIds = cardMatches.map((card) => card.oracleId);

    if (matchingOracleIds.length === 0) {
      matchingOracleIds = ["__no_match__"];
    }
  }

  const setCardsRaw = await prisma.setCard.findMany({
    where: buildSetCardWhere(setCode, filters, matchingOracleIds),
    take: 500,
  });

  const catalogCards =
    setCardsRaw.length > 0
      ? await prisma.card.findMany({
          where: {
            oracleId: { in: setCardsRaw.map((card) => card.oracleId) },
          },
          select: {
            oracleId: true,
            edhrecSlug: true,
            typeLine: true,
            cmc: true,
            colorIdentity: true,
            imageUri: true,
            isCommander: true,
          },
        })
      : [];

  const catalogByOracle = new Map(catalogCards.map((card) => [card.oracleId, card]));
  const setCards = sortSetCards(
    setCardsRaw,
    catalogByOracle,
    resolvedSetCardSort(filters),
    resolvedSetCardOrder(filters),
  );

  return (
    <PageShell
      title={mtgSet.name}
      description={`${mtgSet.code.toUpperCase()} · ${formatSetType(mtgSet.setType)} · ${formatReleaseDate(mtgSet.releasedAt)}`}
      breadcrumbs={[
        { label: "Sets", href: "/sets" },
        { label: mtgSet.name, href: `/sets/${mtgSet.code}` },
      ]}
      toolbar={
        <Suspense fallback={null}>
          <SetCardFilters setCode={mtgSet.code} />
        </Suspense>
      }
    >
      {setCards.length === 0 ? (
        <EmptyState
          title={mtgSet.cardCount > 0 ? "Cards not indexed yet" : "No cards in this set"}
          description={
            mtgSet.cardCount > 0
              ? `Run npm run sync:scryfall-set-cards -- --codes=${mtgSet.code} to load cards for this set.`
              : "This set has no playable cards."
          }
        />
      ) : (
        <>
          <PageListMeta>
            Showing {setCards.length}
            {setCards.length >= 500 ? "+" : ""} cards
            {hasActiveSetCardFilters(filters) ? " (filtered)" : ""}
          </PageListMeta>

          <ul className={`mt-6 ${CARD_FACE_GRID_CLASS}`}>
            {setCards.map((setCard) => {
              const catalog = catalogByOracle.get(setCard.oracleId);
              const imageUri = setCard.imageUri ?? catalog?.imageUri ?? null;
              const detailHref = catalog?.edhrecSlug
                ? catalog.isCommander
                  ? `/commanders/${catalog.edhrecSlug}?set=${mtgSet.code}`
                  : `/cards/${catalog.edhrecSlug}?set=${mtgSet.code}`
                : null;
              const footerParts = [
                `#${setCard.collectorNumber}`,
                catalog?.cmc != null ? `CMC ${catalog.cmc}` : null,
                catalog?.isCommander ? "Commander" : null,
              ].filter(Boolean);

              return (
                <li key={setCard.id}>
                  <CardFaceTile
                    href={detailHref}
                    imageUri={imageUri}
                    name={setCard.name}
                    footer={
                      <>
                        <span className="min-w-0 truncate text-xs text-muted-foreground">
                          {footerParts.join(" · ")}
                        </span>
                        <span className="flex shrink-0 items-center gap-1.5">
                          {setCard.rarity ? <RarityIcon rarity={setCard.rarity} size="xs" /> : null}
                          {catalog?.colorIdentity.length ? (
                            <ColorIdentity colors={catalog.colorIdentity} size="xs" />
                          ) : null}
                        </span>
                      </>
                    }
                  />
                </li>
              );
            })}
          </ul>
        </>
      )}
    </PageShell>
  );
}
