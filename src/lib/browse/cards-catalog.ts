import type { Prisma, PrismaClient } from "@/generated/prisma/client";

import {
  applyRarityOracleFilter,
  buildAllCardWhere,
  cardBrowseSelect,
} from "@/lib/browse/cards-filters";
import {
  allCursorPayload,
  type CardBrowseCursor,
  type CardBrowseParams,
} from "@/lib/browse/cards-params";
import { type AllCardSort, type CardBrowseItem } from "@/lib/browse/cards-shared";
import { decodeBrowseCursor } from "@/lib/browse/cursor";
import { parseBrowseLimit } from "@/lib/browse/params";
import { buildBrowseListResponse } from "@/lib/browse/response";
import type { BrowseListResponse, BrowseOrder } from "@/lib/browse/types";

function mapAllRow(
  row: Prisma.CardGetPayload<{
    select: typeof cardBrowseSelect & {
      edhrecCardData: { select: { slug: true } };
    };
  }>,
): CardBrowseItem {
  return {
    id: row.id,
    name: row.name,
    edhrecSlug: row.edhrecSlug,
    typeLine: row.typeLine,
    cmc: row.cmc,
    colorIdentity: row.colorIdentity,
    imageUri: row.imageUri,
    isCommander: row.isCommander,
    prices: row.prices,
    hasEdhrecData: row.edhrecCardData != null,
    rank: null,
    salt: null,
    numDecks: null,
    inclusion: null,
    potentialDecks: null,
  };
}

function getAllOrderBy(sort: AllCardSort, order: BrowseOrder): Prisma.CardOrderByWithRelationInput[] {
  switch (sort) {
    case "cmc":
      return [{ cmc: order }, { name: "asc" }, { id: "asc" }];
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
  const sort = (params.sort ?? "name") as AllCardSort;
  const order = params.order ?? "asc";
  const limit = params.limit ?? parseBrowseLimit(null);
  const filters = params.filters ?? {};
  const baseWhere = await applyRarityOracleFilter(
    prisma,
    buildAllCardWhere(filters),
    filters.rarities,
  );

  const decoded = decodeBrowseCursor<CardBrowseCursor>(params.cursor);
  if (decoded && (decoded.tab !== "all" || decoded.sort !== sort || decoded.order !== order)) {
    throw new Error("Cursor does not match tab/sort/order parameters");
  }

  const total = await prisma.card.count({ where: baseWhere });
  const cursorWhere = decoded ? buildAllCursorWhere(decoded) : undefined;
  const where: Prisma.CardWhereInput = cursorWhere ? { AND: [baseWhere, cursorWhere] } : baseWhere;

  const rows = await prisma.card.findMany({
    where,
    orderBy: getAllOrderBy(sort, order),
    take: limit + 1,
    select: {
      ...cardBrowseSelect,
      edhrecCardData: { select: { slug: true } },
    },
  });

  const items = rows.map(mapAllRow);

  return buildBrowseListResponse(items, limit, total, (item) =>
    allCursorPayload(item, sort, order),
  );
}
