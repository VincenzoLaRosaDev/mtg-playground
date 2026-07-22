import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { CardFaceTile } from "@/components/discovery/card-face-tile";
import { EmptyState } from "@/components/discovery/empty-state";
import {
  BrowseToolbarSkeleton,
  CardGridSkeleton,
  PageListMetaSkeleton,
} from "@/components/discovery/loading-skeletons";
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
import { parseCardFaces } from "@/lib/scryfall/faces";
import { createPageMetadata } from "@/lib/seo/site";
import { CARD_FACE_GRID_CLASS } from "@/lib/ui/card-face";

export const dynamic = "force-dynamic";

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

async function SetDetailContent({ params, searchParams }: SetDetailPageProps) {
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
    filters.format ||
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

  const printingsRaw = await prisma.printing.findMany({
    where: buildSetCardWhere(setCode, filters, matchingOracleIds),
    take: 500,
  });

  const catalogCards =
    printingsRaw.length > 0
      ? await prisma.card.findMany({
          where: {
            oracleId: { in: printingsRaw.map((row) => row.oracleId) },
          },
          select: {
            oracleId: true,
            slug: true,
            typeLine: true,
            cmc: true,
            colorIdentity: true,
            imageUri: true,
            isCommander: true,
          },
        })
      : [];

  const catalogByOracle = new Map(catalogCards.map((card) => [card.oracleId, card]));
  const printings = sortSetCards(
    printingsRaw,
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
        <Suspense fallback={<BrowseToolbarSkeleton variant="setDetail" />}>
          <SetCardFilters setCode={mtgSet.code} />
        </Suspense>
      }
    >
      {printings.length === 0 ? (
        <EmptyState
          title={mtgSet.cardCount > 0 ? "Printings not indexed yet" : "No cards in this set"}
          description={
            mtgSet.cardCount > 0
              ? "Run npm run sync:scryfall-printings to load printings for this set."
              : "This set has no playable cards."
          }
        />
      ) : (
        <>
          <PageListMeta>
            Showing {printings.length}
            {printings.length >= 500 ? "+" : ""} printings
            {hasActiveSetCardFilters(filters) ? " (filtered)" : ""}
          </PageListMeta>

          <ul className={`mt-6 ${CARD_FACE_GRID_CLASS}`}>
            {printings.map((printing) => {
              const catalog = catalogByOracle.get(printing.oracleId);
              const imageUri = printing.imageUri ?? catalog?.imageUri ?? null;
              const faces = parseCardFaces(printing.faces);
              const detailHref = catalog?.slug
                ? `/cards/${catalog.slug}?set=${mtgSet.code}&cn=${encodeURIComponent(printing.collectorNumber)}`
                : null;
              return (
                <li key={printing.id}>
                  <CardFaceTile
                    href={detailHref}
                    imageUri={imageUri}
                    faces={faces}
                    name={printing.name}
                    footer={
                      <p className="w-full text-center text-xs tabular-nums text-muted-foreground">
                        #{printing.collectorNumber}
                      </p>
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

export default function SetDetailPage(props: SetDetailPageProps) {
  return (
    <Suspense
      fallback={
        <PageShell
          title="…"
          description="Loading set…"
          breadcrumbs={[
            { label: "Sets", href: "/sets" },
            { label: "…", href: "#" },
          ]}
          toolbar={<BrowseToolbarSkeleton variant="setDetail" />}
        >
          <PageListMetaSkeleton />
          <div className="mt-6">
            <CardGridSkeleton count={12} footerLines={1} />
          </div>
        </PageShell>
      }
    >
      <SetDetailContent {...props} />
    </Suspense>
  );
}
