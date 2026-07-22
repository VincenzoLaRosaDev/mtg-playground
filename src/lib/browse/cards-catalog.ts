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
    listPrice: row.listPriceEur ?? parseCatalogListPrice(row.prices),
    colorSort: row.colorSort,
  };
}

function getAllOrderBy(sort: AllCardSort, order: BrowseOrder): Prisma.CardOrderByWithRelationInput[] {
  switch (sort) {
    case "cmc":
      return [{ cmc: order }, { name: "asc" }, { id: "asc" }];
    case "color":
      return [{ colorSort: order }, { cmc: "asc" }, { name: "asc" }, { id: "asc" }];
    case "popularity":
      return [{ popularityRank: { sort: order, nulls: "last" } }, { name: "asc" }, { id: "asc" }];
    case "price":
      return [{ listPriceEur: { sort: order, nulls: "last" } }, { name: "asc" }, { id: "asc" }];
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

  if (cursor.sort === "color") {
    const colorSort = cursor.colorSort ?? 0;
    const cmc = cursor.cmc ?? 0;
    return {
      OR: [
        { colorSort: { [forwardPrimary]: colorSort } },
        {
          AND: [
            { colorSort },
            {
              OR: [
                { cmc: { gt: cmc } },
                {
                  AND: [
                    { cmc },
                    {
                      OR: [
                        { name: { gt: cursor.name } },
                        { AND: [{ name: cursor.name }, { id: { [forwardTie]: id } }] },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
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

  if (cursor.sort === "price") {
    const price = cursor.listPrice;
    if (price == null) {
      return {
        AND: [
          { listPriceEur: null },
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
        { listPriceEur: { [forwardPrimary]: price } },
        {
          AND: [
            { listPriceEur: price },
            {
              OR: [
                { name: { gt: cursor.name } },
                { AND: [{ name: cursor.name }, { id: { [forwardTie]: id } }] },
              ],
            },
          ],
        },
        { listPriceEur: null },
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

  const decoded = decodeBrowseCursor<CardBrowseCursor>(params.cursor);
  if (decoded && (decoded.sort !== sort || decoded.order !== order)) {
    throw new Error("Cursor does not match sort/order parameters");
  }

  const total = await prisma.card.count({ where: baseWhere });
  const cursorWhere = decoded ? buildAllCursorWhere(decoded) : undefined;
  const where: Prisma.CardWhereInput = cursorWhere
    ? { AND: [baseWhere, cursorWhere] }
    : baseWhere;

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
