import type { Prisma, PrismaClient } from "@/generated/prisma/client";

import { buildColorIdentityWhere } from "@/lib/browse/color-identity-filter";
import type { PriceBand } from "@/lib/browse/cards-shared";
import { resolveOracleIdsForRarities } from "@/lib/browse/rarity-filter-server";
import { playableCatalogCardWhere } from "@/lib/scryfall/catalog-filters";
import { isFunctionalRole, isSynergyTheme } from "@/lib/classification/types";

export type CardBrowseFilters = {
  query?: string;
  colors?: string[];
  cmcMin?: number;
  cmcMax?: number;
  typeContains?: string;
  commanderLegal?: boolean;
  commandersOnly?: boolean;
  rarities?: string[];
  /** Exclude cards without a URL slug (needed for detail links). */
  requireSlug?: boolean;
  role?: string;
  theme?: string;
  gameChanger?: boolean;
  reserved?: boolean;
  priceBand?: PriceBand;
};

export const cardBrowseSelect = {
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

  if (filters.requireSlug) {
    where.slug = { not: null };
  }

  if (filters.gameChanger) {
    where.isGameChanger = true;
  }

  if (filters.reserved) {
    where.isReserved = true;
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

async function resolveOracleIdsForClassification(
  prisma: PrismaClient,
  filters: Pick<CardBrowseFilters, "role" | "theme">,
): Promise<string[] | null> {
  if (!filters.role && !filters.theme) {
    return null;
  }

  const role = filters.role && isFunctionalRole(filters.role) ? filters.role : undefined;
  const theme = filters.theme && isSynergyTheme(filters.theme) ? filters.theme : undefined;

  if (filters.role && !role) {
    return [];
  }
  if (filters.theme && !theme) {
    return [];
  }

  const rows = await prisma.cardClassification.findMany({
    where: {
      ...(role ? { roles: { has: role } } : {}),
      ...(theme ? { themes: { has: theme } } : {}),
    },
    select: { oracleId: true },
  });

  return rows.map((row) => row.oracleId);
}

async function resolveOracleIdsForPriceBand(
  prisma: PrismaClient,
  band: PriceBand,
): Promise<string[]> {
  // Catalog price bands use Scryfall EUR (Cardmarket). Cards without eur are excluded.
  if (band === "low") {
    const rows = await prisma.$queryRaw<Array<{ oracle_id: string }>>`
      SELECT oracle_id
      FROM cards
      WHERE prices->>'eur' IS NOT NULL
        AND prices->>'eur' <> ''
        AND (prices->>'eur')::numeric < 1
    `;
    return rows.map((row) => row.oracle_id);
  }

  if (band === "mid") {
    const rows = await prisma.$queryRaw<Array<{ oracle_id: string }>>`
      SELECT oracle_id
      FROM cards
      WHERE prices->>'eur' IS NOT NULL
        AND prices->>'eur' <> ''
        AND (prices->>'eur')::numeric >= 1
        AND (prices->>'eur')::numeric <= 5
    `;
    return rows.map((row) => row.oracle_id);
  }

  const rows = await prisma.$queryRaw<Array<{ oracle_id: string }>>`
    SELECT oracle_id
    FROM cards
    WHERE prices->>'eur' IS NOT NULL
      AND prices->>'eur' <> ''
      AND (prices->>'eur')::numeric > 5
  `;
  return rows.map((row) => row.oracle_id);
}

export async function applyFacetOracleFilters(
  prisma: PrismaClient,
  where: Prisma.CardWhereInput,
  filters: CardBrowseFilters,
): Promise<Prisma.CardWhereInput> {
  let next = await applyRarityOracleFilter(prisma, where, filters.rarities);

  const classificationIds = await resolveOracleIdsForClassification(prisma, filters);
  if (classificationIds) {
    if (classificationIds.length === 0) {
      return { AND: [next, { oracleId: { in: ["__no_match__"] } }] };
    }
    next = { AND: [next, { oracleId: { in: classificationIds } }] };
  }

  if (filters.priceBand) {
    const priceIds = await resolveOracleIdsForPriceBand(prisma, filters.priceBand);
    if (priceIds.length === 0) {
      return { AND: [next, { oracleId: { in: ["__no_match__"] } }] };
    }
    next = { AND: [next, { oracleId: { in: priceIds } }] };
  }

  return next;
}

export function buildAllCardWhere(filters: CardBrowseFilters): Prisma.CardWhereInput {
  return buildCatalogCardWhere(filters);
}
