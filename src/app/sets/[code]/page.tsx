import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CardImage } from "@/components/discovery/card-image";
import { EmptyState } from "@/components/discovery/empty-state";
import { SetCardFilters } from "@/components/discovery/set-card-filters";
import { PageShell } from "@/components/layout/page-shell";
import { prisma } from "@/lib/db";
import {
  buildSetCardWhere,
  formatReleaseDate,
  formatSetType,
  parseSetCardFilters,
} from "@/lib/scryfall/sets";
import { createPageMetadata } from "@/lib/seo/site";

type SetDetailPageProps = {
  params: Promise<{ code: string }>;
  searchParams: Promise<{
    q?: string;
    rarity?: string;
    color?: string;
    commander?: string;
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

function formatColorIdentity(colors: string[]): string {
  return colors.length > 0 ? colors.join("") : "C";
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

  if (filters.colors?.length || filters.commanderLegal) {
    const cardMatches = await prisma.card.findMany({
      where: {
        ...(filters.colors?.length
          ? {
              OR: [
                { colors: { hasSome: filters.colors } },
                ...(filters.colors.includes("C") ? [{ colors: { equals: [] } }] : []),
              ],
            }
          : {}),
        ...(filters.commanderLegal
          ? {
              legalities: {
                path: ["commander"],
                equals: "legal",
              },
            }
          : {}),
      },
      select: { oracleId: true },
    });

    matchingOracleIds = cardMatches.map((card) => card.oracleId);

    if (matchingOracleIds.length === 0) {
      matchingOracleIds = ["__no_match__"];
    }
  }

  const setCards = await prisma.setCard.findMany({
    where: buildSetCardWhere(setCode, filters, matchingOracleIds),
    orderBy: [{ collectorNumber: "asc" }],
    take: 500,
  });

  const catalogCards =
    setCards.length > 0
      ? await prisma.card.findMany({
          where: { oracleId: { in: setCards.map((card) => card.oracleId) } },
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

  return (
    <PageShell
      title={mtgSet.name}
      description={`${mtgSet.code.toUpperCase()} · ${formatSetType(mtgSet.setType)} · ${formatReleaseDate(mtgSet.releasedAt)}`}
      breadcrumbs={[
        { label: "Sets", href: "/sets" },
        { label: mtgSet.name, href: `/sets/${mtgSet.code}` },
      ]}
    >
      <SetCardFilters setCode={mtgSet.code} filters={filters} />

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
          <p className="mb-4 text-sm text-zinc-500">
            Showing {setCards.length}
            {setCards.length >= 500 ? "+" : ""} cards
            {filters.query || filters.rarities?.length || filters.colors?.length || filters.commanderLegal
              ? " (filtered)"
              : ""}
          </p>

          <ul className="space-y-3">
            {setCards.map((setCard) => {
              const catalog = catalogByOracle.get(setCard.oracleId);
              const imageUri = setCard.imageUri ?? catalog?.imageUri ?? null;
              const detailHref = catalog?.edhrecSlug ? `/cards/${catalog.edhrecSlug}` : null;

              return (
                <li
                  key={setCard.id}
                  className="flex items-center gap-4 rounded-lg border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
                >
                  {imageUri ? (
                    <CardImage src={imageUri} alt={setCard.name} variant="thumbnail" />
                  ) : (
                    <div className="flex h-[62px] w-[44px] shrink-0 items-center justify-center rounded border border-zinc-200 bg-zinc-100 text-xs text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900">
                      ?
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    {detailHref ? (
                      <Link href={detailHref} className="font-medium hover:underline">
                        {setCard.name}
                      </Link>
                    ) : (
                      <p className="font-medium">{setCard.name}</p>
                    )}
                    <p className="text-sm text-zinc-600">
                      #{setCard.collectorNumber} · {setCard.rarity}
                      {catalog?.typeLine ? ` · ${catalog.typeLine}` : ""}
                    </p>
                    {catalog && (
                      <p className="text-xs text-zinc-500">
                        CMC {catalog.cmc} · {formatColorIdentity(catalog.colorIdentity)}
                        {catalog.isCommander ? " · Commander" : ""}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </PageShell>
  );
}
