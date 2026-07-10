import type { PrismaClient } from "@/generated/prisma/client";

import {
  GLOBAL_SEARCH_DEFAULT_LIMIT,
  GLOBAL_SEARCH_MAX_LIMIT,
  GLOBAL_SEARCH_MIN_QUERY_LENGTH,
  type GlobalSearchCardResult,
  type GlobalSearchCommanderResult,
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

function mapProfileCommander(
  row: {
    slug: string;
    name: string;
    rank: number | null;
    card: { imageUri: string | null; typeLine: string | null } | null;
  },
): GlobalSearchCommanderResult {
  return {
    slug: row.slug,
    name: row.name,
    rank: row.rank,
    imageUri: row.card?.imageUri ?? null,
    typeLine: row.card?.typeLine ?? null,
  };
}

function mapCatalogCommander(
  row: {
    edhrecSlug: string | null;
    name: string;
    imageUri: string | null;
    typeLine: string;
  },
): GlobalSearchCommanderResult | null {
  if (!row.edhrecSlug) return null;

  return {
    slug: row.edhrecSlug,
    name: row.name,
    rank: null,
    imageUri: row.imageUri,
    typeLine: row.typeLine,
  };
}

export async function queryGlobalSearch(
  prisma: PrismaClient,
  params: GlobalSearchParams,
): Promise<GlobalSearchResponse> {
  const query = params.query.trim();
  const limit = parseSearchLimit(params.limit);

  if (query.length < GLOBAL_SEARCH_MIN_QUERY_LENGTH) {
    return { query, cards: [], commanders: [], sets: [] };
  }

  const searchName = query.toLowerCase();
  const slugQuery = query.toLowerCase().replace(/[^a-z0-9-]+/g, "-");

  const profileRows = await prisma.edhrecCommanderProfile.findMany({
    where: {
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { slug: { contains: slugQuery } },
      ],
    },
    orderBy: [{ rank: "asc" }, { numDecks: "desc" }, { name: "asc" }],
    take: limit,
    select: {
      slug: true,
      name: true,
      rank: true,
      card: {
        select: {
          imageUri: true,
          typeLine: true,
        },
      },
    },
  });

  const commanderSlugs = new Set(profileRows.map((row) => row.slug));
  const remainingCommanderSlots = Math.max(limit - profileRows.length, 0);

  const catalogCommanderRows =
    remainingCommanderSlots > 0
      ? await prisma.card.findMany({
          where: {
            ...playableCatalogCardWhere,
            isCommander: true,
            edhrecSlug: { not: null },
            edhrecCommanderProfile: { is: null },
            ...(commanderSlugs.size > 0
              ? { NOT: { edhrecSlug: { in: [...commanderSlugs] } } }
              : {}),
            OR: buildNameSearchWhere(query, searchName),
          },
          orderBy: [{ name: "asc" }],
          take: remainingCommanderSlots,
          select: {
            edhrecSlug: true,
            name: true,
            imageUri: true,
            typeLine: true,
          },
        })
      : [];

  for (const row of catalogCommanderRows) {
    if (row.edhrecSlug) {
      commanderSlugs.add(row.edhrecSlug);
    }
  }

  const commanders: GlobalSearchCommanderResult[] = [
    ...profileRows.map(mapProfileCommander),
    ...catalogCommanderRows
      .map(mapCatalogCommander)
      .filter((row): row is GlobalSearchCommanderResult => row != null),
  ];

  const cardRows = await prisma.card.findMany({
    where: {
      ...playableCatalogCardWhere,
      OR: buildNameSearchWhere(query, searchName),
      ...(commanderSlugs.size > 0
        ? {
            NOT: {
              isCommander: true,
              edhrecSlug: { in: [...commanderSlugs] },
            },
          }
        : {}),
    },
    orderBy: [{ name: "asc" }],
    take: limit,
    select: {
      name: true,
      edhrecSlug: true,
      typeLine: true,
      cmc: true,
      colorIdentity: true,
      imageUri: true,
      isCommander: true,
    },
  });

  const cards: GlobalSearchCardResult[] = cardRows.map((row) => ({
    slug: row.edhrecSlug,
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

  return { query, cards, commanders, sets };
}
