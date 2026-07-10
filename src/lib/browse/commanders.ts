import type { Prisma, PrismaClient } from "@/generated/prisma/client";

import {
  type AllCommanderSort,
  type CommanderBrowseItem,
  type CommanderBrowseSort,
  type CommanderBrowseTab,
  type RankedCommanderSort,
  defaultOrderForCommanderTab,
  defaultSortForCommanderTab,
} from "@/lib/browse/commanders-shared";
import { decodeBrowseCursor } from "@/lib/browse/cursor";
import { parseBrowseColorsParam, parseBrowseLimit, parseBrowseOrder } from "@/lib/browse/params";
import { buildBrowseListResponse } from "@/lib/browse/response";
import type { BrowseListResponse, BrowseOrder } from "@/lib/browse/types";
import { playableCatalogCardWhere } from "@/lib/scryfall/catalog-filters";

export type {
  AllCommanderSort,
  CommanderBrowseItem,
  CommanderBrowseSort,
  CommanderBrowseTab,
  RankedCommanderSort,
} from "@/lib/browse/commanders-shared";
export { getCommanderBrowseSortOptions } from "@/lib/browse/commanders-shared";

export type CommanderBrowseFilters = {
  query?: string;
  colors?: string[];
  hasEdhrecMeta?: boolean;
};

export type CommanderBrowseParams = {
  tab?: CommanderBrowseTab;
  limit?: number;
  cursor?: string | null;
  sort?: CommanderBrowseSort;
  order?: BrowseOrder;
  filters?: CommanderBrowseFilters;
};

type CommanderBrowseCursor = {
  tab: CommanderBrowseTab;
  sort: CommanderBrowseSort;
  order: BrowseOrder;
  slug?: string;
  id?: string;
  name: string;
  rank?: number | null;
  numDecks?: number | null;
  salt?: number | null;
};

const rankedProfileSelect = {
  slug: true,
  name: true,
  rank: true,
  salt: true,
  numDecks: true,
  colorIdentity: true,
  card: {
    select: {
      id: true,
      imageUri: true,
      typeLine: true,
    },
  },
} as const;

const allCardSelect = {
  id: true,
  name: true,
  edhrecSlug: true,
  typeLine: true,
  colorIdentity: true,
  imageUri: true,
  edhrecCommanderProfile: {
    select: {
      slug: true,
      name: true,
      rank: true,
      salt: true,
      numDecks: true,
      colorIdentity: true,
    },
  },
} as const;

function parseCommanderBrowseTab(value: string | null | undefined): CommanderBrowseTab {
  return value === "all" ? "all" : "ranked";
}

function parseCommanderBrowseSort(
  tab: CommanderBrowseTab,
  value: string | null | undefined,
): CommanderBrowseSort {
  if (tab === "ranked") {
    if (value === "numDecks" || value === "name" || value === "salt" || value === "rank") {
      return value;
    }
    return "rank";
  }

  if (value === "name" || value === "rank" || value === "salt" || value === "numDecks") {
    return value;
  }

  return "numDecks";
}

function buildRankedColorFilter(colors: string[]): Prisma.EdhrecCommanderProfileWhereInput {
  const parts: Prisma.EdhrecCommanderProfileWhereInput[] = [
    { colorIdentity: { hasSome: colors.filter((color) => color !== "C") } },
  ];

  if (colors.includes("C")) {
    parts.push({ colorIdentity: { equals: [] } });
  }

  return { OR: parts };
}

function buildRankedWhere(filters: CommanderBrowseFilters): Prisma.EdhrecCommanderProfileWhereInput {
  const where: Prisma.EdhrecCommanderProfileWhereInput = {
    rank: { not: null },
  };

  if (filters.query && filters.query.length >= 2) {
    where.OR = [
      { name: { contains: filters.query, mode: "insensitive" } },
      { slug: { contains: filters.query.toLowerCase() } },
    ];
  }

  if (filters.colors?.length) {
    where.AND = [
      ...(Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : []),
      buildRankedColorFilter(filters.colors),
    ];
  }

  return where;
}

function buildAllWhere(filters: CommanderBrowseFilters): Prisma.CardWhereInput {
  const where: Prisma.CardWhereInput = {
    ...playableCatalogCardWhere,
    isCommander: true,
  };

  if (filters.query && filters.query.length >= 2) {
    const searchName = filters.query.toLowerCase();
    where.OR = [
      { searchName: { startsWith: searchName } },
      { searchName: { contains: searchName } },
      { name: { contains: filters.query, mode: "insensitive" } },
      { edhrecCommanderProfile: { name: { contains: filters.query, mode: "insensitive" } } },
    ];
  }

  if (filters.colors?.length) {
    const colorFilters: Prisma.CardWhereInput[] = [
      { colorIdentity: { hasSome: filters.colors.filter((color) => color !== "C") } },
    ];

    if (filters.colors.includes("C")) {
      colorFilters.push({ colorIdentity: { equals: [] } });
    }

    where.AND = [
      ...(Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : []),
      { OR: colorFilters },
    ];
  }

  if (filters.hasEdhrecMeta === true) {
    where.edhrecCommanderProfile = { isNot: null };
  } else if (filters.hasEdhrecMeta === false) {
    where.edhrecCommanderProfile = { is: null };
  }

  return where;
}

function mapRankedRow(
  row: Prisma.EdhrecCommanderProfileGetPayload<{ select: typeof rankedProfileSelect }>,
): CommanderBrowseItem {
  return {
    cardId: row.card?.id ?? null,
    slug: row.slug,
    name: row.name,
    rank: row.rank,
    salt: row.salt,
    numDecks: row.numDecks,
    colorIdentity: row.colorIdentity,
    imageUri: row.card?.imageUri ?? null,
    typeLine: row.card?.typeLine ?? null,
    hasEdhrecMeta: true,
  };
}

function mapAllRow(
  row: Prisma.CardGetPayload<{ select: typeof allCardSelect }>,
): CommanderBrowseItem | null {
  const profile = row.edhrecCommanderProfile;
  const slug = profile?.slug ?? row.edhrecSlug;

  if (!slug) return null;

  return {
    cardId: row.id,
    slug,
    name: profile?.name ?? row.name,
    rank: profile?.rank ?? null,
    salt: profile?.salt ?? null,
    numDecks: profile?.numDecks ?? null,
    colorIdentity: profile?.colorIdentity.length ? profile.colorIdentity : row.colorIdentity,
    imageUri: row.imageUri,
    typeLine: row.typeLine,
    hasEdhrecMeta: profile != null,
  };
}

function nullableProfileOrder(
  field: "rank" | "numDecks" | "salt",
  order: BrowseOrder,
): Prisma.EdhrecCommanderProfileOrderByWithRelationInput {
  return {
    [field]: { sort: order, nulls: "last" },
  } as Prisma.EdhrecCommanderProfileOrderByWithRelationInput;
}

function getRankedOrderBy(
  sort: RankedCommanderSort,
  order: BrowseOrder,
): Prisma.EdhrecCommanderProfileOrderByWithRelationInput[] {
  switch (sort) {
    case "numDecks":
      return [nullableProfileOrder("numDecks", order), { slug: "asc" }];
    case "name":
      return [{ name: order }, { slug: "asc" }];
    case "salt":
      return [nullableProfileOrder("salt", order), { slug: "asc" }];
    case "rank":
    default:
      return [nullableProfileOrder("rank", order), { slug: "asc" }];
  }
}

function getAllOrderBy(
  sort: AllCommanderSort,
  order: BrowseOrder,
): Prisma.CardOrderByWithRelationInput[] {
  switch (sort) {
    case "name":
      return [{ name: order }, { id: "asc" }];
    case "rank":
      return [
        { edhrecCommanderProfile: { rank: { sort: order, nulls: "last" } } },
        { name: "asc" },
        { id: "asc" },
      ];
    case "salt":
      return [
        { edhrecCommanderProfile: { salt: { sort: order, nulls: "last" } } },
        { name: "asc" },
        { id: "asc" },
      ];
    case "numDecks":
    default:
      return [
        { edhrecCommanderProfile: { numDecks: { sort: order, nulls: "last" } } },
        { name: "asc" },
        { id: "asc" },
      ];
  }
}

function buildRankedCursorWhere(
  cursor: CommanderBrowseCursor,
): Prisma.EdhrecCommanderProfileWhereInput {
  const forwardPrimary = cursor.order === "asc" ? "gt" : "lt";
  const forwardTie = "gt";
  const slug = cursor.slug ?? "";

  switch (cursor.sort) {
    case "numDecks": {
      const numDecks = cursor.numDecks;
      if (numDecks == null) return { slug: { [forwardTie]: slug } };
      return {
        OR: [
          { numDecks: { [forwardPrimary]: numDecks } },
          { AND: [{ numDecks }, { slug: { [forwardTie]: slug } }] },
        ],
      };
    }
    case "name":
      return {
        OR: [
          { name: { [forwardPrimary]: cursor.name } },
          { AND: [{ name: cursor.name }, { slug: { [forwardTie]: slug } }] },
        ],
      };
    case "salt": {
      const salt = cursor.salt;
      if (salt == null) return { slug: { [forwardTie]: slug } };
      return {
        OR: [
          { salt: { [forwardPrimary]: salt } },
          { AND: [{ salt }, { slug: { [forwardTie]: slug } }] },
        ],
      };
    }
    case "rank":
    default: {
      const rank = cursor.rank;
      if (rank == null) return { slug: { [forwardTie]: slug } };
      return {
        OR: [
          { rank: { [forwardPrimary]: rank } },
          { AND: [{ rank }, { slug: { [forwardTie]: slug } }] },
        ],
      };
    }
  }
}

function profileRelationFieldIsNullWhere(
  field: "numDecks" | "rank" | "salt",
): Prisma.CardWhereInput {
  return {
    OR: [
      { edhrecCommanderProfile: { is: null } },
      { edhrecCommanderProfile: { [field]: null } },
    ],
  };
}

function buildAllNameCursorWhere(cursor: CommanderBrowseCursor): Prisma.CardWhereInput {
  const forwardPrimary = cursor.order === "asc" ? "gt" : "lt";
  const forwardTie = "gt";
  const id = cursor.id ?? "";

  return {
    OR: [
      { name: { [forwardPrimary]: cursor.name } },
      { AND: [{ name: cursor.name }, { id: { [forwardTie]: id } }] },
    ],
  };
}

function buildAllRelationCursorWhere(
  cursor: CommanderBrowseCursor,
  field: "numDecks" | "rank" | "salt",
): Prisma.CardWhereInput {
  const forwardPrimary = cursor.order === "asc" ? "gt" : "lt";
  const forwardTie = "gt";
  const id = cursor.id ?? "";
  const value = cursor[field];

  if (value == null) {
    return {
      AND: [
        profileRelationFieldIsNullWhere(field),
        {
          OR: [
            { name: { [forwardTie]: cursor.name } },
            { AND: [{ name: cursor.name }, { id: { [forwardTie]: id } }] },
          ],
        },
      ],
    };
  }

  return {
    OR: [
      { edhrecCommanderProfile: { [field]: { [forwardPrimary]: value } } },
      {
        AND: [
          { edhrecCommanderProfile: { [field]: value } },
          {
            OR: [
              { name: { [forwardTie]: cursor.name } },
              { AND: [{ name: cursor.name }, { id: { [forwardTie]: id } }] },
            ],
          },
        ],
      },
    ],
  };
}

function buildAllCursorWhere(cursor: CommanderBrowseCursor): Prisma.CardWhereInput {
  switch (cursor.sort) {
    case "name":
      return buildAllNameCursorWhere(cursor);
    case "rank":
      return buildAllRelationCursorWhere(cursor, "rank");
    case "salt":
      return buildAllRelationCursorWhere(cursor, "salt");
    case "numDecks":
    default:
      return buildAllRelationCursorWhere(cursor, "numDecks");
  }
}

function rankedCursorPayload(
  row: CommanderBrowseItem,
  sort: RankedCommanderSort,
  order: BrowseOrder,
): CommanderBrowseCursor {
  return {
    tab: "ranked",
    sort,
    order,
    slug: row.slug,
    name: row.name,
    rank: row.rank,
    numDecks: row.numDecks,
    salt: row.salt,
  };
}

function allCursorPayload(
  row: CommanderBrowseItem,
  sort: AllCommanderSort,
  order: BrowseOrder,
): CommanderBrowseCursor {
  return {
    tab: "all",
    sort,
    order,
    id: row.cardId ?? undefined,
    name: row.name,
    rank: row.rank,
    numDecks: row.numDecks,
    salt: row.salt,
  };
}

export function parseCommanderBrowseParams(searchParams: URLSearchParams): CommanderBrowseParams {
  const tab = parseCommanderBrowseTab(searchParams.get("tab"));
  const sort = parseCommanderBrowseSort(tab, searchParams.get("sort"));
  const hasEdhrecParam = searchParams.get("has_edhrec");

  return {
    tab,
    limit: parseBrowseLimit(searchParams.get("limit")),
    cursor: searchParams.get("cursor"),
    sort,
    order: parseBrowseOrder(searchParams.get("order"), defaultOrderForCommanderTab(tab, sort)),
    filters: {
      query: searchParams.get("q")?.trim() || undefined,
      colors: parseBrowseColorsParam(searchParams.get("color")),
      hasEdhrecMeta:
        hasEdhrecParam === "true" ? true : hasEdhrecParam === "false" ? false : undefined,
    },
  };
}

async function queryRankedCommandersBrowse(
  prisma: PrismaClient,
  params: CommanderBrowseParams,
): Promise<BrowseListResponse<CommanderBrowseItem>> {
  const sort = (params.sort ?? "rank") as RankedCommanderSort;
  const order = params.order ?? "asc";
  const limit = params.limit ?? parseBrowseLimit(null);
  const filters = params.filters ?? {};
  const baseWhere = buildRankedWhere(filters);

  const decoded = decodeBrowseCursor<CommanderBrowseCursor>(params.cursor);
  if (decoded && (decoded.tab !== "ranked" || decoded.sort !== sort || decoded.order !== order)) {
    throw new Error("Cursor does not match tab/sort/order parameters");
  }

  const total = await prisma.edhrecCommanderProfile.count({ where: baseWhere });
  const cursorWhere = decoded ? buildRankedCursorWhere(decoded) : undefined;
  const where: Prisma.EdhrecCommanderProfileWhereInput = cursorWhere
    ? { AND: [baseWhere, cursorWhere] }
    : baseWhere;

  const rows = await prisma.edhrecCommanderProfile.findMany({
    where,
    orderBy: getRankedOrderBy(sort, order),
    take: limit + 1,
    select: rankedProfileSelect,
  });

  const items = rows.map(mapRankedRow);

  return buildBrowseListResponse(items, limit, total, (item) =>
    rankedCursorPayload(item, sort, order),
  );
}

async function queryAllCommandersBrowse(
  prisma: PrismaClient,
  params: CommanderBrowseParams,
): Promise<BrowseListResponse<CommanderBrowseItem>> {
  const sort = (params.sort ?? "numDecks") as AllCommanderSort;
  const order = params.order ?? "desc";
  const limit = params.limit ?? parseBrowseLimit(null);
  const filters = params.filters ?? {};
  const baseWhere = buildAllWhere(filters);

  const decoded = decodeBrowseCursor<CommanderBrowseCursor>(params.cursor);
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
    select: allCardSelect,
  });

  const items = rows.map(mapAllRow).filter((item): item is CommanderBrowseItem => item != null);

  return buildBrowseListResponse(items, limit, total, (item) => allCursorPayload(item, sort, order));
}

export async function queryCommandersBrowse(
  prisma: PrismaClient,
  params: CommanderBrowseParams,
): Promise<BrowseListResponse<CommanderBrowseItem>> {
  const tab = params.tab ?? "ranked";

  if (tab === "all") {
    return queryAllCommandersBrowse(prisma, params);
  }

  return queryRankedCommandersBrowse(prisma, params);
}
