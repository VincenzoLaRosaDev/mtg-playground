import type { PrismaClient } from "@/generated/prisma/client";

import {
  GLOBAL_SEARCH_DEFAULT_LIMIT,
  GLOBAL_SEARCH_MAX_LIMIT,
  GLOBAL_SEARCH_MIN_QUERY_LENGTH,
  type GlobalSearchCardResult,
  type GlobalSearchResponse,
  type GlobalSearchSetResult,
} from "@/lib/search/types";
import { playableCatalogCardWhere } from "@/lib/scryfall/catalog-filters";

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

function buildNameSearchWhere(query: string, searchName: string) {
  return [
    { searchName: { startsWith: searchName } },
    { searchName: { contains: searchName } },
    { name: { contains: query, mode: "insensitive" as const } },
  ];
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

  const searchName = query.toLowerCase();

  const cardRows = await prisma.card.findMany({
    where: {
      ...playableCatalogCardWhere,
      OR: buildNameSearchWhere(query, searchName),
    },
    orderBy: [{ name: "asc" }],
    take: limit,
    select: {
      name: true,
      slug: true,
      typeLine: true,
      cmc: true,
      colorIdentity: true,
      imageUri: true,
      isCommander: true,
    },
  });

  const cards: GlobalSearchCardResult[] = cardRows.map((row) => ({
    slug: row.slug,
    name: row.name,
    typeLine: row.typeLine,
    cmc: row.cmc,
    colorIdentity: row.colorIdentity,
    imageUri: row.imageUri,
    isCommander: row.isCommander,
  }));

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
    },
  });

  const sets: GlobalSearchSetResult[] = setRows.map((row) => ({
    code: row.code,
    name: row.name,
    setType: row.setType,
    iconUri: row.iconUri,
    releasedAt: row.releasedAt?.toISOString() ?? null,
  }));

  return { query, cards, sets };
}
