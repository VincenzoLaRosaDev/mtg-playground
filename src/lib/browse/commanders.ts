import type { Prisma, PrismaClient } from "@/generated/prisma/client";
import { EdhrecTopEntityType } from "@/generated/prisma/client";

import {
  type CommanderBrowseItem,
  type CommanderBrowseSort,
  type RankedCommanderSort,
  defaultOrderForCommanderTab,
  defaultSortForCommanderTab,
} from "@/lib/browse/commanders-shared";
import { decodeBrowseCursor } from "@/lib/browse/cursor";
import { buildProfileColorIdentityWhere } from "@/lib/browse/color-identity-filter";
import { parseBrowseColorsParam, parseBrowseLimit, parseBrowseOptionalNumber, parseBrowseOrder } from "@/lib/browse/params";
import { buildBrowseListResponse } from "@/lib/browse/response";
import {
  filterTopEntriesByQuery,
  loadTopEntryRows,
  sliceAfterTopCursor,
  sortTopEntries,
  topIndexHasEntries,
} from "@/lib/browse/top-entries";
import type { BrowseListResponse, BrowseOrder } from "@/lib/browse/types";
import {
  DEFAULT_EDHREC_TOP_WINDOW,
  parseEdhrecTopWindowParam,
  type EdhrecTopWindowParam,
} from "@/lib/edhrec/top-window";

export type {
  CommanderBrowseItem,
  CommanderBrowseSort,
  RankedCommanderSort,
} from "@/lib/browse/commanders-shared";
export { getCommanderBrowseSortOptions } from "@/lib/browse/commanders-shared";

export type CommanderBrowseFilters = {
  query?: string;
  colors?: string[];
  cmcMin?: number;
  cmcMax?: number;
  typeContains?: string;
};

export type CommanderBrowseParams = {
  window?: EdhrecTopWindowParam;
  limit?: number;
  cursor?: string | null;
  sort?: CommanderBrowseSort;
  order?: BrowseOrder;
  filters?: CommanderBrowseFilters;
};

type CommanderBrowseCursor = {
  window?: EdhrecTopWindowParam;
  sort: CommanderBrowseSort;
  order: BrowseOrder;
  slug?: string;
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
      cmc: true,
    },
  },
} as const;

function parseCommanderBrowseSort(value: string | null | undefined): CommanderBrowseSort {
  if (value === "numDecks" || value === "name" || value === "salt" || value === "rank") {
    return value;
  }

  return defaultSortForCommanderTab();
}

function buildCommanderCardAttributeFilter(
  filters: CommanderBrowseFilters,
): Prisma.CardWhereInput {
  const where: Prisma.CardWhereInput = {};

  if (filters.cmcMin != null || filters.cmcMax != null) {
    where.cmc = {
      ...(filters.cmcMin != null ? { gte: filters.cmcMin } : {}),
      ...(filters.cmcMax != null ? { lte: filters.cmcMax } : {}),
    };
  }

  if (filters.typeContains) {
    where.typeLine = { contains: filters.typeContains, mode: "insensitive" };
  }

  return where;
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
      buildProfileColorIdentityWhere(filters.colors),
    ];
  }

  const cardFilter = buildCommanderCardAttributeFilter(filters);
  if (Object.keys(cardFilter).length > 0) {
    where.AND = [
      ...(Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : []),
      { card: { is: cardFilter } },
    ];
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
    cmc: row.card?.cmc ?? null,
    colorIdentity: row.colorIdentity,
    imageUri: row.card?.imageUri ?? null,
    typeLine: row.card?.typeLine ?? null,
    hasEdhrecMeta: true,
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

function rankedCursorPayload(
  row: CommanderBrowseItem,
  sort: RankedCommanderSort,
  order: BrowseOrder,
  window: EdhrecTopWindowParam,
): CommanderBrowseCursor {
  return {
    window,
    sort,
    order,
    slug: row.slug,
    name: row.name,
    rank: row.rank,
    numDecks: row.numDecks,
    salt: row.salt,
  };
}

export function parseCommanderBrowseParams(searchParams: URLSearchParams): CommanderBrowseParams {
  if (searchParams.get("tab") === "all") {
    throw new Error(
      'tab=all is not supported on /api/commanders/browse. Use GET /api/cards/browse?tab=all&commanders_only=true for catalog commanders.',
    );
  }

  const sort = parseCommanderBrowseSort(searchParams.get("sort"));

  return {
    window: parseEdhrecTopWindowParam(searchParams.get("window")),
    limit: parseBrowseLimit(searchParams.get("limit")),
    cursor: searchParams.get("cursor"),
    sort,
    order: parseBrowseOrder(searchParams.get("order"), defaultOrderForCommanderTab(sort)),
    filters: {
      query: searchParams.get("q")?.trim() || undefined,
      colors: parseBrowseColorsParam(searchParams.get("color")),
      cmcMin: parseBrowseOptionalNumber(searchParams.get("cmc_min")),
      cmcMax: parseBrowseOptionalNumber(searchParams.get("cmc_max")),
      typeContains: searchParams.get("type")?.trim() || undefined,
    },
  };
}

async function queryRankedFromTopIndex(
  prisma: PrismaClient,
  params: CommanderBrowseParams,
  window: EdhrecTopWindowParam,
): Promise<BrowseListResponse<CommanderBrowseItem> | null> {
  const hasEntries = await topIndexHasEntries(prisma, EdhrecTopEntityType.COMMANDER, window);
  if (!hasEntries) {
    return null;
  }

  const sort = (params.sort ?? "rank") as RankedCommanderSort;
  const order = params.order ?? "asc";
  const limit = params.limit ?? parseBrowseLimit(null);
  const filters = params.filters ?? {};

  const decoded = decodeBrowseCursor<CommanderBrowseCursor>(params.cursor);
  if (
    decoded &&
    (decoded.sort !== sort ||
      decoded.order !== order ||
      (decoded.window ?? DEFAULT_EDHREC_TOP_WINDOW) !== window)
  ) {
    throw new Error("Cursor does not match sort/order/window parameters");
  }

  const topEntries = filterTopEntriesByQuery(
    await loadTopEntryRows(prisma, EdhrecTopEntityType.COMMANDER, window),
    filters.query,
  );

  const profileWhere: Prisma.EdhrecCommanderProfileWhereInput = {
    slug: { in: topEntries.map((entry) => entry.slug) },
  };

  if (filters.colors?.length) {
    profileWhere.AND = [
      ...(Array.isArray(profileWhere.AND) ? profileWhere.AND : profileWhere.AND ? [profileWhere.AND] : []),
      buildProfileColorIdentityWhere(filters.colors),
    ];
  }

  const cardFilter = buildCommanderCardAttributeFilter(filters);
  if (Object.keys(cardFilter).length > 0) {
    profileWhere.AND = [
      ...(Array.isArray(profileWhere.AND) ? profileWhere.AND : profileWhere.AND ? [profileWhere.AND] : []),
      { card: { is: cardFilter } },
    ];
  }

  const profiles = await prisma.edhrecCommanderProfile.findMany({
    where: profileWhere,
    select: rankedProfileSelect,
  });

  const profileBySlug = new Map(profiles.map((profile) => [profile.slug, profile]));

  type EnrichedTopEntry = (typeof topEntries)[number] & {
    salt: number | null;
    numDecks: number | null;
  };

  const sortField =
    sort === "name"
      ? "name"
      : sort === "numDecks"
        ? "numDecks"
        : sort === "salt"
          ? "salt"
          : "rank";

  let enriched: EnrichedTopEntry[] = topEntries
    .filter((entry) => profileBySlug.has(entry.slug))
    .map((entry) => {
      const profile = profileBySlug.get(entry.slug)!;

      return {
        ...entry,
        rank: entry.rank,
        numDecks: entry.numDecks ?? profile.numDecks,
        salt: profile.salt,
      };
    });

  enriched = sortTopEntries(enriched, sortField, order, (row) => row.salt);

  const total = enriched.length;

  if (decoded?.rank != null && decoded.slug) {
    enriched = sliceAfterTopCursor(
      enriched,
      {
        sort: sortField,
        order,
        rank: decoded.rank,
        slug: decoded.slug,
        name: decoded.name,
        numDecks: decoded.numDecks,
        inclusion: undefined,
        salt: decoded.salt,
      },
    );
  }

  const items: CommanderBrowseItem[] = enriched.slice(0, limit + 1).map((entry) => {
    const profile = profileBySlug.get(entry.slug)!;

    return mapRankedRow({
      ...profile,
      rank: entry.rank,
      numDecks: entry.numDecks ?? profile.numDecks,
    });
  });

  const response = buildBrowseListResponse(items, limit, total, (item) =>
    rankedCursorPayload(item, sort, order, window),
  );

  return {
    ...response,
    meta: {
      popularityDataAvailable: true,
      window,
    },
  };
}

async function queryRankedCommandersBrowseLegacy(
  prisma: PrismaClient,
  params: CommanderBrowseParams,
  window: EdhrecTopWindowParam,
  options?: { allTimeSource?: boolean },
): Promise<BrowseListResponse<CommanderBrowseItem>> {
  const sort = (params.sort ?? "rank") as RankedCommanderSort;
  const order = params.order ?? "asc";
  const limit = params.limit ?? parseBrowseLimit(null);
  const filters = params.filters ?? {};
  const baseWhere = buildRankedWhere(filters);

  const decoded = decodeBrowseCursor<CommanderBrowseCursor>(params.cursor);
  if (decoded && (decoded.sort !== sort || decoded.order !== order)) {
    throw new Error("Cursor does not match sort/order parameters");
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

  return {
    ...buildBrowseListResponse(items, limit, total, (item) =>
      rankedCursorPayload(item, sort, order, window),
    ),
    meta: {
      popularityDataAvailable: options?.allTimeSource === true,
      window,
    },
  };
}

async function queryRankedCommandersBrowse(
  prisma: PrismaClient,
  params: CommanderBrowseParams,
): Promise<BrowseListResponse<CommanderBrowseItem>> {
  const window = params.window ?? DEFAULT_EDHREC_TOP_WINDOW;

  if (window === "all") {
    return queryRankedCommandersBrowseLegacy(prisma, params, window, { allTimeSource: true });
  }

  const fromTopIndex = await queryRankedFromTopIndex(prisma, params, window);

  if (fromTopIndex) {
    return fromTopIndex;
  }

  return queryRankedCommandersBrowseLegacy(prisma, params, window);
}

export async function queryCommandersBrowse(
  prisma: PrismaClient,
  params: CommanderBrowseParams,
): Promise<BrowseListResponse<CommanderBrowseItem>> {
  return queryRankedCommandersBrowse(prisma, params);
}
