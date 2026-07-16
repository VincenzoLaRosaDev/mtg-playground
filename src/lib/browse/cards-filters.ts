import type { Prisma, PrismaClient } from "@/generated/prisma/client";

import { buildColorIdentityWhere } from "@/lib/browse/color-identity-filter";
import { resolveOracleIdsForRarities } from "@/lib/browse/rarity-filter-server";
import { playableCatalogCardWhere } from "@/lib/scryfall/catalog-filters";

export type CardBrowseFilters = {
  query?: string;
  colors?: string[];
  cmcMin?: number;
  cmcMax?: number;
  typeContains?: string;
  commanderLegal?: boolean;
  commandersOnly?: boolean;
  rarities?: string[];
  hasEdhrec?: boolean;
};

export const cardBrowseSelect = {
  id: true,
  name: true,
  edhrecSlug: true,
  typeLine: true,
  cmc: true,
  colorIdentity: true,
  imageUri: true,
  isCommander: true,
  prices: true,
} as const;

export function buildCatalogCardWhere(filters: CardBrowseFilters): Prisma.CardWhereInput {
  const where: Prisma.CardWhereInput = {
    ...playableCatalogCardWhere,
  };

  if (filters.query && filters.query.length >= 2) {
    const searchName = filters.query.toLowerCase();
    where.OR = [
      { searchName: { startsWith: searchName } },
      { searchName: { contains: searchName } },
      { name: { contains: filters.query, mode: "insensitive" } },
    ];
  }

  if (filters.colors?.length) {
    where.AND = [
      ...(Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : []),
      buildColorIdentityWhere(filters.colors),
    ];
  }

  if (filters.cmcMin != null || filters.cmcMax != null) {
    where.cmc = {
      ...(filters.cmcMin != null ? { gte: filters.cmcMin } : {}),
      ...(filters.cmcMax != null ? { lte: filters.cmcMax } : {}),
    };
  }

  if (filters.typeContains) {
    where.typeLine = { contains: filters.typeContains, mode: "insensitive" };
  }

  if (filters.commanderLegal) {
    where.legalities = { path: ["commander"], equals: "legal" };
  }

  if (filters.commandersOnly) {
    where.isCommander = true;
  }

  return where;
}

export async function applyRarityOracleFilter(
  prisma: PrismaClient,
  where: Prisma.CardWhereInput,
  rarities?: string[],
): Promise<Prisma.CardWhereInput> {
  if (!rarities?.length) {
    return where;
  }

  const oracleIds = await resolveOracleIdsForRarities(prisma, rarities);

  if (oracleIds.length === 0) {
    return { AND: [where, { oracleId: { in: ["__no_match__"] } }] };
  }

  return { AND: [where, { oracleId: { in: oracleIds } }] };
}

export function buildAllCardWhere(filters: CardBrowseFilters): Prisma.CardWhereInput {
  const where = buildCatalogCardWhere(filters);

  if (filters.hasEdhrec === true) {
    where.edhrecCardData = { isNot: null };
  } else if (filters.hasEdhrec === false) {
    where.edhrecCardData = { is: null };
  }

  return where;
}
