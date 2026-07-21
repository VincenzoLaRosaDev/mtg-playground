import type { PrismaClient } from "@/generated/prisma/client";

import { listRankedCardIdsMatchingTextSearch } from "@/lib/search/card-text-search-query";
import { parseCardFaces } from "@/lib/scryfall/faces";
import {
  GLOBAL_SEARCH_DEFAULT_LIMIT,
  GLOBAL_SEARCH_MAX_LIMIT,
  GLOBAL_SEARCH_MIN_QUERY_LENGTH,
  type GlobalSearchCardResult,
  type GlobalSearchResponse,
  type GlobalSearchSetResult,
} from "@/lib/search/types";

export type GlobalSearchParams = {
  query: string;
  limit?: number;
};

function parseSearchLimit(value: number | undefined): number {
  if (value == null || !Number.isFinite(value) || value < 1) {
    return GLOBAL_SEARCH_DEFAULT_LIMIT;
  }

  return Math.min(Math.floor(value), GLOBAL_SEARCH_MAX_LIMIT);
}

export async function queryGlobalSearch(
  prisma: PrismaClient,
  params: GlobalSearchParams,
): Promise<GlobalSearchResponse> {
  const query = params.query.trim();
  const limit = parseSearchLimit(params.limit);

  if (query.length < GLOBAL_SEARCH_MIN_QUERY_LENGTH) {
    return { query, cards: [], sets: [] };
  }

  const rankedIds = await listRankedCardIdsMatchingTextSearch(prisma, query, limit);
  const cardRows =
    rankedIds && rankedIds.length > 0
      ? await prisma.card.findMany({
          where: { id: { in: rankedIds } },
          select: {
            id: true,
            name: true,
            slug: true,
            typeLine: true,
            cmc: true,
            colorIdentity: true,
            imageUri: true,
            faces: true,
            isCommander: true,
            prices: true,
            popularityRank: true,
            frictionScore: true,
            isGameChanger: true,
            isReserved: true,
          },
        })
      : [];

  const byId = new Map(cardRows.map((row) => [row.id, row]));
  const cards: GlobalSearchCardResult[] = (rankedIds ?? [])
    .map((id) => byId.get(id))
    .filter((row): row is NonNullable<typeof row> => row != null)
    .map((row) => ({
      id: row.id,
      slug: row.slug,
      name: row.name,
      typeLine: row.typeLine,
      cmc: row.cmc,
      colorIdentity: row.colorIdentity,
      imageUri: row.imageUri,
      faces: parseCardFaces(row.faces),
      isCommander: row.isCommander,
      prices: row.prices,
      popularityRank: row.popularityRank,
      frictionScore: row.frictionScore,
      isGameChanger: row.isGameChanger,
      isReserved: row.isReserved,
    }));

  const searchName = query.toLowerCase();
  const setRows = await prisma.mtgSet.findMany({
    where: {
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { code: { contains: searchName } },
      ],
    },
    orderBy: [{ releasedAt: "desc" }, { name: "asc" }],
    take: limit,
    select: {
      code: true,
      name: true,
      setType: true,
      iconUri: true,
      releasedAt: true,
      digital: true,
      cardCount: true,
      _count: { select: { printings: true } },
    },
  });

  const sets: GlobalSearchSetResult[] = setRows.map((row) => ({
    code: row.code,
    name: row.name,
    setType: row.setType,
    iconUri: row.iconUri,
    releasedAt: row.releasedAt?.toISOString() ?? null,
    digital: row.digital,
    cardCount: row.cardCount,
    indexedCardCount: row._count.printings,
  }));

  return { query, cards, sets };
}
