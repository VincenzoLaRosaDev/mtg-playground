import type { Prisma, PrismaClient } from "@/generated/prisma/client";

import { decodeBrowseCursor } from "@/lib/browse/cursor";
import { buildBrowseListResponse } from "@/lib/browse/response";
import type { BrowseListResponse, BrowseOrder } from "@/lib/browse/types";
import { parseBrowseLimit, parseBrowseOrder } from "@/lib/browse/params";
import {
  defaultSetBrowseOrder,
  defaultSetBrowseSort,
  type SetBrowseSort,
} from "@/lib/browse/sets-shared";

export type { SetBrowseSort } from "@/lib/browse/sets-shared";
export { getSetBrowseSortOptions } from "@/lib/browse/sets-shared";

export type SetBrowseItem = {
  code: string;
  name: string;
  releasedAt: Date | null;
  setType: string;
  cardCount: number;
  iconUri: string | null;
  digital: boolean;
  indexedCardCount: number;
};

export type SetBrowseFilters = {
  query?: string;
  setType?: string;
  digital?: boolean;
  indexedOnly?: boolean;
};

export type SetBrowseParams = {
  limit?: number;
  cursor?: string | null;
  sort?: SetBrowseSort;
  order?: BrowseOrder;
  filters?: SetBrowseFilters;
};

type SetBrowseCursor = {
  sort: SetBrowseSort;
  order: BrowseOrder;
  code: string;
  releasedAt: string | null;
  name: string;
  cardCount: number;
  indexedCardCount: number;
};

const setSelect = {
  code: true,
  name: true,
  releasedAt: true,
  setType: true,
  cardCount: true,
  iconUri: true,
  digital: true,
  _count: {
    select: { setCards: true },
  },
} as const;

function parseSetBrowseSort(value: string | null | undefined): SetBrowseSort {
  if (value === "name" || value === "cardCount" || value === "indexed") {
    return value;
  }

  return defaultSetBrowseSort();
}

function buildSetFilters(filters: SetBrowseFilters): Prisma.MtgSetWhereInput {
  const where: Prisma.MtgSetWhereInput = {};

  if (filters.query && filters.query.length >= 2) {
    where.OR = [
      { name: { contains: filters.query, mode: "insensitive" } },
      { code: { contains: filters.query.toLowerCase() } },
    ];
  }

  if (filters.setType) {
    where.setType = filters.setType;
  }

  if (filters.digital === true) {
    where.digital = true;
  } else if (filters.digital === false) {
    where.digital = false;
  }

  if (filters.indexedOnly) {
    where.setCards = { some: {} };
  }

  return where;
}

function buildCursorWhere(
  cursor: SetBrowseCursor,
): Prisma.MtgSetWhereInput | undefined {
  const forwardPrimary = cursor.order === "asc" ? "gt" : "lt";
  const forwardTie = "gt";

  switch (cursor.sort) {
    case "name": {
      return {
        OR: [
          { name: { [forwardPrimary]: cursor.name } },
          { AND: [{ name: cursor.name }, { code: { [forwardTie]: cursor.code } }] },
        ],
      };
    }
    case "cardCount": {
      return {
        OR: [
          { cardCount: { [forwardPrimary]: cursor.cardCount } },
          {
            AND: [
              { cardCount: cursor.cardCount },
              { code: { [forwardTie]: cursor.code } },
            ],
          },
        ],
      };
    }
    case "indexed": {
      return { code: { [forwardTie]: cursor.code } };
    }
    case "releasedAt":
    default: {
      const releasedAt = cursor.releasedAt ? new Date(cursor.releasedAt) : null;

      if (releasedAt) {
        return {
          OR: [
            { releasedAt: { [forwardPrimary]: releasedAt } },
            { AND: [{ releasedAt }, { code: { [forwardTie]: cursor.code } }] },
          ],
        };
      }

      return { code: { [forwardTie]: cursor.code } };
    }
  }
}

function getOrderBy(
  sort: SetBrowseSort,
  order: BrowseOrder,
): Prisma.MtgSetOrderByWithRelationInput[] {
  switch (sort) {
    case "name":
      return [{ name: order }, { code: "asc" }];
    case "cardCount":
      return [{ cardCount: order }, { code: "asc" }];
    case "indexed":
      return [{ setCards: { _count: order } }, { code: "asc" }];
    case "releasedAt":
    default:
      return [{ releasedAt: order }, { code: "asc" }];
  }
}

function mapSetRow(
  row: Prisma.MtgSetGetPayload<{ select: typeof setSelect }>,
): SetBrowseItem {
  return {
    code: row.code,
    name: row.name,
    releasedAt: row.releasedAt,
    setType: row.setType,
    cardCount: row.cardCount,
    iconUri: row.iconUri,
    digital: row.digital,
    indexedCardCount: row._count.setCards,
  };
}

function cursorPayload(item: SetBrowseItem, sort: SetBrowseSort, order: BrowseOrder) {
  return {
    sort,
    order,
    code: item.code,
    releasedAt: item.releasedAt?.toISOString() ?? null,
    name: item.name,
    cardCount: item.cardCount,
    indexedCardCount: item.indexedCardCount,
  };
}

export function parseSetBrowseParams(searchParams: URLSearchParams): SetBrowseParams {
  const digitalParam = searchParams.get("digital");
  const indexedParam = searchParams.get("indexed");

  return {
    limit: parseBrowseLimit(searchParams.get("limit")),
    cursor: searchParams.get("cursor"),
    sort: parseSetBrowseSort(searchParams.get("sort")),
    order: parseBrowseOrder(
      searchParams.get("order"),
      defaultSetBrowseOrder(parseSetBrowseSort(searchParams.get("sort"))),
    ),
    filters: {
      query: searchParams.get("q")?.trim() || undefined,
      setType: searchParams.get("set_type")?.trim() || undefined,
      digital:
        digitalParam === "true" ? true : digitalParam === "false" ? false : undefined,
      indexedOnly: indexedParam === "true",
    },
  };
}

export async function querySetsBrowse(
  prisma: PrismaClient,
  params: SetBrowseParams,
): Promise<BrowseListResponse<SetBrowseItem>> {
  const sort = params.sort ?? "releasedAt";
  const order = params.order ?? "desc";
  const limit = params.limit ?? parseBrowseLimit(null);
  const filters = params.filters ?? {};
  const baseWhere = buildSetFilters(filters);

  const decoded = decodeBrowseCursor<SetBrowseCursor>(params.cursor);
  if (decoded && (decoded.sort !== sort || decoded.order !== order)) {
    throw new Error("Cursor does not match sort/order parameters");
  }

  const total = await prisma.mtgSet.count({ where: baseWhere });

  if (sort === "indexed") {
    const allRows = await prisma.mtgSet.findMany({
      where: baseWhere,
      select: setSelect,
    });

    const mapped = allRows.map(mapSetRow).sort((a, b) => {
      const countCompare =
        order === "asc"
          ? a.indexedCardCount - b.indexedCardCount
          : b.indexedCardCount - a.indexedCardCount;

      if (countCompare !== 0) return countCompare;
      return a.code.localeCompare(b.code);
    });

    let startIndex = 0;
    if (decoded) {
      const cursorIndex = mapped.findIndex((item) => item.code === decoded.code);
      startIndex = cursorIndex >= 0 ? cursorIndex + 1 : 0;
    }

    const slice = mapped.slice(startIndex, startIndex + limit + 1);
    return buildBrowseListResponse(slice, limit, total, (item) =>
      cursorPayload(item, sort, order),
    );
  }

  const cursorWhere = decoded ? buildCursorWhere(decoded) : undefined;
  const where: Prisma.MtgSetWhereInput = cursorWhere
    ? { AND: [baseWhere, cursorWhere] }
    : baseWhere;

  const rows = await prisma.mtgSet.findMany({
    where,
    orderBy: getOrderBy(sort, order),
    take: limit + 1,
    select: setSelect,
  });

  const items = rows.map(mapSetRow);

  return buildBrowseListResponse(items, limit, total, (item) =>
    cursorPayload(item, sort, order),
  );
}