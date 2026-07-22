import type { Prisma, PrismaClient } from "@/generated/prisma/client";

import { buildCatalogCardWhere } from "@/lib/browse/cards-filters";
import type { CollectionFacets } from "@/lib/collection/collection-filters";
import {
  CARD_TEXT_SEARCH_MIN_LENGTH,
  cardIdsTextSearchWhere,
  listCardIdsMatchingTextSearch,
} from "@/lib/search/card-text-search-query";

/**
 * Distinct oracle ids present in the user's collection (qty &gt; 0).
 * Bounds facet resolution to inventory size instead of the full catalog.
 */
export async function listUserCollectionOracleIds(
  prisma: PrismaClient,
  userId: string,
): Promise<string[]> {
  const rows = await prisma.$queryRaw<Array<{ oracle_id: string }>>`
    SELECT DISTINCT p.oracle_id
    FROM collection_items ci
    INNER JOIN printings p ON p.id = ci.printing_id
    WHERE ci.user_id = ${userId}
      AND ci.quantity > 0
  `;
  return rows.map((row) => row.oracle_id);
}

/**
 * Oracle ids matching card-level facets, intersected with the user's collection.
 * `undefined` = no oracle constraint. Empty array = no matches.
 */
export async function resolveCollectionOracleIds(
  prisma: PrismaClient,
  userId: string,
  facets: CollectionFacets,
): Promise<string[] | undefined> {
  const hasQuery =
    Boolean(facets.query) &&
    (facets.query?.length ?? 0) >= CARD_TEXT_SEARCH_MIN_LENGTH;
  const needsCard =
    Boolean(facets.colors?.length) ||
    Boolean(facets.format) ||
    Boolean(facets.typeContains) ||
    facets.cmcMin != null ||
    facets.cmcMax != null ||
    hasQuery;

  if (!needsCard) return undefined;

  const userOracleIds = await listUserCollectionOracleIds(prisma, userId);
  if (userOracleIds.length === 0) return [];

  let where: Prisma.CardWhereInput = {
    AND: [
      buildCatalogCardWhere({
        colors: facets.colors,
        format: facets.format,
        typeContains: facets.typeContains,
        cmcMin: facets.cmcMin,
        cmcMax: facets.cmcMax,
      }),
      { oracleId: { in: userOracleIds } },
    ],
  };

  if (hasQuery && facets.query) {
    const textIds = await listCardIdsMatchingTextSearch(prisma, facets.query);
    if (textIds != null) {
      where = { AND: [where, cardIdsTextSearchWhere(textIds)] };
    }
  }

  const cards = await prisma.card.findMany({
    where,
    select: { oracleId: true },
  });

  return cards.map((card) => card.oracleId);
}

export function buildCollectionItemWhere(
  userId: string,
  scopeWhere: Prisma.CollectionItemWhereInput,
  facets: CollectionFacets,
  matchingOracleIds?: string[],
): Prisma.CollectionItemWhereInput {
  const printingWhere: Prisma.PrintingWhereInput = {};

  if (facets.rarities?.length) {
    printingWhere.rarity = { in: facets.rarities };
  }

  if (matchingOracleIds) {
    printingWhere.oracleId = {
      in: matchingOracleIds.length > 0 ? matchingOracleIds : ["__no_match__"],
    };
  }

  if (facets.setQuery) {
    const setQuery = facets.setQuery;
    printingWhere.AND = [
      ...(Array.isArray(printingWhere.AND)
        ? printingWhere.AND
        : printingWhere.AND
          ? [printingWhere.AND]
          : []),
      {
        OR: [
          { setCode: { equals: setQuery, mode: "insensitive" } },
          { set: { name: { contains: setQuery, mode: "insensitive" } } },
        ],
      },
    ];
  }

  const where: Prisma.CollectionItemWhereInput = {
    userId,
    ...scopeWhere,
  };

  if (facets.finishes?.length) {
    where.finish = { in: facets.finishes };
  }

  if (Object.keys(printingWhere).length > 0) {
    where.printing = printingWhere;
  }

  return where;
}
