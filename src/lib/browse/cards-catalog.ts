import type { Prisma, PrismaClient } from "@/generated/prisma/client";

import {
  applyFacetOracleFilters,
  buildAllCardWhere,
  cardBrowseSelect,
} from "@/lib/browse/cards-filters";
import {
  allCursorPayload,
  type CardBrowseCursor,
  type CardBrowseParams,
} from "@/lib/browse/cards-params";
import {
  type AllCardSort,
  type CardBrowseItem,
} from "@/lib/browse/cards-shared";
import { decodeBrowseCursor } from "@/lib/browse/cursor";
import { parseBrowseLimit } from "@/lib/browse/params";
import { buildBrowseListResponse } from "@/lib/browse/response";
import type { BrowseListResponse, BrowseOrder } from "@/lib/browse/types";
import { parseCatalogListPrice } from "@/lib/scryfall/card-prices";
import { parseCardFaces } from "@/lib/scryfall/faces";

function mapAllRow(
  row: Prisma.CardGetPayload<{ select: typeof cardBrowseSelect }>,
): CardBrowseItem {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
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
    listPrice: parseCatalogListPrice(row.prices),
  };
}

function getAllOrderBy(sort: AllCardSort, order: BrowseOrder): Prisma.CardOrderByWithRelationInput[] {
  switch (sort) {
    case "cmc":
      return [{ cmc: order }, { name: "asc" }, { id: "asc" }];
    case "popularity":
      return [{ popularityRank: { sort: order, nulls: "last" } }, { name: "asc" }, { id: "asc" }];
    case "price":
      // Price uses raw SQL path in queryAllCardsBrowse.
      return [{ name: order }, { id: "asc" }];
    case "name":
    default:
      return [{ name: order }, { id: "asc" }];
  }
}

function buildAllCursorWhere(cursor: CardBrowseCursor): Prisma.CardWhereInput {
  const forwardPrimary = cursor.order === "asc" ? "gt" : "lt";
  const forwardTie = "gt";
  const id = cursor.id ?? "";

  if (cursor.sort === "cmc") {
    const cmc = cursor.cmc ?? 0;
    return {
      OR: [
        { cmc: { [forwardPrimary]: cmc } },
        { AND: [{ cmc }, { id: { [forwardTie]: id } }] },
      ],
    };
  }

  if (cursor.sort === "popularity") {
    const rank = cursor.popularityRank;
    if (rank == null) {
      // After all ranked rows: continue by name/id among null ranks.
      return {
        AND: [
          { popularityRank: null },
          {
            OR: [
              { name: { [forwardPrimary]: cursor.name } },
              { AND: [{ name: cursor.name }, { id: { [forwardTie]: id } }] },
            ],
          },
        ],
      };
    }

    return {
      OR: [
        { popularityRank: { [forwardPrimary]: rank } },
        {
          AND: [
            { popularityRank: rank },
            {
              OR: [
                { name: { gt: cursor.name } },
                { AND: [{ name: cursor.name }, { id: { [forwardTie]: id } }] },
              ],
            },
          ],
        },
        { popularityRank: null },
      ],
    };
  }

  return {
    OR: [
      { name: { [forwardPrimary]: cursor.name } },
      { AND: [{ name: cursor.name }, { id: { [forwardTie]: id } }] },
    ],
  };
}

async function queryPriceSortedBrowse(
  prisma: PrismaClient,
  params: CardBrowseParams,
  baseWhere: Prisma.CardWhereInput,
  sort: AllCardSort,
  order: BrowseOrder,
  limit: number,
): Promise<BrowseListResponse<CardBrowseItem>> {
  const total = await prisma.card.count({ where: baseWhere });
  const decoded = decodeBrowseCursor<CardBrowseCursor>(params.cursor);
  if (decoded && (decoded.sort !== sort || decoded.order !== order)) {
    throw new Error("Cursor does not match sort/order parameters");
  }

  // Fetch a wider window and sort by parsed EUR list price in memory — acceptable for
  // catalog browse pages until list_price is denormalized. Cursor resumes after the last
  // seen id among the sorted stream.
  const candidates = await prisma.card.findMany({
    where: baseWhere,
    select: cardBrowseSelect,
    take: 5000,
  });

  const mapped = candidates.map(mapAllRow);
  mapped.sort((a, b) => {
    const aNull = a.listPrice == null;
    const bNull = b.listPrice == null;
    if (aNull && bNull) {
      return a.name.localeCompare(b.name) || a.id.localeCompare(b.id);
    }
    if (aNull) return 1;
    if (bNull) return -1;
    const primary = order === "asc" ? a.listPrice! - b.listPrice! : b.listPrice! - a.listPrice!;
    if (primary !== 0) return primary;
    return a.name.localeCompare(b.name) || a.id.localeCompare(b.id);
  });

  let start = 0;
  if (decoded?.id) {
    const idx = mapped.findIndex((item) => item.id === decoded.id);
    start = idx >= 0 ? idx + 1 : 0;
  }

  const page = mapped.slice(start, start + limit + 1);
  return buildBrowseListResponse(page, limit, total, (item) =>
    allCursorPayload(item, sort, order),
  );
}

export async function queryAllCardsBrowse(
  prisma: PrismaClient,
  params: CardBrowseParams,
): Promise<BrowseListResponse<CardBrowseItem>> {
  const sort = (params.sort ?? "popularity") as AllCardSort;
  const order = params.order ?? "asc";
  const limit = params.limit ?? parseBrowseLimit(null);
  const filters = params.filters ?? {};
  const baseWhere = await applyFacetOracleFilters(
    prisma,
    buildAllCardWhere(filters),
    filters,
  );

  if (sort === "price") {
    return queryPriceSortedBrowse(prisma, params, baseWhere, sort, order, limit);
  }

  const decoded = decodeBrowseCursor<CardBrowseCursor>(params.cursor);
  if (decoded && (decoded.sort !== sort || decoded.order !== order)) {
    throw new Error("Cursor does not match sort/order parameters");
  }

  const total = await prisma.card.count({ where: baseWhere });
  const cursorWhere = decoded ? buildAllCursorWhere(decoded) : undefined;
  const where: Prisma.CardWhereInput = cursorWhere ? { AND: [baseWhere, cursorWhere] } : baseWhere;

  const rows = await prisma.card.findMany({
    where,
    orderBy: getAllOrderBy(sort, order),
    take: limit + 1,
    select: cardBrowseSelect,
  });

  const items = rows.map(mapAllRow);

  return buildBrowseListResponse(items, limit, total, (item) =>
    allCursorPayload(item, sort, order),
  );
}
