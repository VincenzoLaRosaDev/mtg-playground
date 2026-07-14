import type { Prisma, PrismaClient } from "@/generated/prisma/client";
import { EdhrecSyncTier, EdhrecTopEntityType } from "@/generated/prisma/client";

import {
  type AllCardSort,
  type CardBrowseItem,
  type CardBrowseSort,
  type CardBrowseTab,
  type PopularCardSort,
  defaultOrderForTab,
} from "@/lib/browse/cards-shared";
import { decodeBrowseCursor } from "@/lib/browse/cursor";
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
  DEFAULT_EDHREC_CARD_TOP_WINDOW,
  parseCardTopWindowParam,
  type EdhrecCardTopWindowParam,
} from "@/lib/edhrec/top-window";
import { buildColorIdentityWhere } from "@/lib/browse/color-identity-filter";
import { parseRaritiesParam } from "@/lib/browse/rarity-filter";
import { resolveOracleIdsForRarities } from "@/lib/browse/rarity-filter-server";
import { playableCatalogCardWhere } from "@/lib/scryfall/catalog-filters";

export type {
  AllCardSort,
  CardBrowseItem,
  CardBrowseSort,
  CardBrowseTab,
  PopularCardSort,
} from "@/lib/browse/cards-shared";
export { getCardBrowseSortOptions } from "@/lib/browse/cards-shared";

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

export type CardBrowseParams = {
  tab?: CardBrowseTab;
  window?: EdhrecCardTopWindowParam;
  limit?: number;
  cursor?: string | null;
  sort?: CardBrowseSort;
  order?: BrowseOrder;
  filters?: CardBrowseFilters;
};

type CardBrowseCursor = {
  tab: CardBrowseTab;
  window?: EdhrecCardTopWindowParam;
  sort: CardBrowseSort;
  order: BrowseOrder;
  slug?: string;
  id?: string;
  name: string;
  rank?: number | null;
  inclusion?: number | null;
  numDecks?: number | null;
  salt?: number | null;
  cmc?: number;
};

const cardBrowseSelect = {
  id: true,
  name: true,
  edhrecSlug: true,
  typeLine: true,
  cmc: true,
  colorIdentity: true,
  imageUri: true,
  isCommander: true,
} as const;

function parseCardBrowseTab(value: string | null | undefined): CardBrowseTab {
  return value === "all" ? "all" : "popular";
}

function defaultOrderForCardBrowseTab(tab: CardBrowseTab, sort: CardBrowseSort): "asc" | "desc" {
  if (tab === "all") {
    if (sort === "name" || sort === "cmc") return "asc";
    return "desc";
  }

  return defaultOrderForTab(sort);
}

function parseCardBrowseSort(tab: CardBrowseTab, value: string | null | undefined): CardBrowseSort {
  if (tab === "popular") {
    if (
      value === "rank" ||
      value === "numDecks" ||
      value === "name" ||
      value === "salt" ||
      value === "inclusion"
    ) {
      return value;
    }
    return "rank";
  }

  return value === "cmc" ? "cmc" : "name";
}

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

async function applyRarityOracleFilter(
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

async function buildPopularCardWhere(
  prisma: PrismaClient,
  filters: CardBrowseFilters,
): Promise<Prisma.CardWhereInput> {
  return applyRarityOracleFilter(prisma, buildCatalogCardWhere(filters), filters.rarities);
}

async function buildPopularWhere(
  prisma: PrismaClient,
  filters: CardBrowseFilters,
): Promise<Prisma.EdhrecCardDataWhereInput> {
  const where: Prisma.EdhrecCardDataWhereInput = {
    syncTier: { in: [EdhrecSyncTier.HOT, EdhrecSyncTier.WARM] },
    card: { is: await buildPopularCardWhere(prisma, filters) },
  };

  if (filters.query && filters.query.length >= 2) {
    where.OR = [
      { name: { contains: filters.query, mode: "insensitive" } },
      { slug: { contains: filters.query.toLowerCase() } },
    ];
  }

  return where;
}

function buildAllWhere(filters: CardBrowseFilters): Prisma.CardWhereInput {
  const where = buildCatalogCardWhere(filters);

  if (filters.hasEdhrec === true) {
    where.edhrecCardData = { isNot: null };
  } else if (filters.hasEdhrec === false) {
    where.edhrecCardData = { is: null };
  }

  return where;
}

function mapPopularRow(
  row: Prisma.EdhrecCardDataGetPayload<{
    select: {
      slug: true;
      name: true;
      salt: true;
      numDecks: true;
      inclusion: true;
      potentialDecks: true;
      card: { select: typeof cardBrowseSelect };
    };
  }>,
): CardBrowseItem | null {
  if (!row.card) return null;

  return {
    ...row.card,
    hasEdhrecData: true,
    rank: null,
    salt: row.salt,
    numDecks: row.numDecks,
    inclusion: row.inclusion,
    potentialDecks: row.potentialDecks,
  };
}

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
    hasEdhrecData: row.edhrecCardData != null,
    rank: null,
    salt: null,
    numDecks: null,
    inclusion: null,
    potentialDecks: null,
  };
}

function nullableOrder(
  field: "inclusion" | "numDecks" | "salt" | "name",
  order: BrowseOrder,
): Prisma.EdhrecCardDataOrderByWithRelationInput {
  return {
    [field]: { sort: order, nulls: "last" },
  } as Prisma.EdhrecCardDataOrderByWithRelationInput;
}

function getPopularOrderBy(
  sort: PopularCardSort,
  order: BrowseOrder,
): Prisma.EdhrecCardDataOrderByWithRelationInput[] {
  switch (sort) {
    case "rank":
      return [
        nullableOrder("inclusion", order === "asc" ? "desc" : "asc"),
        { slug: "asc" },
      ];
    case "numDecks":
      return [nullableOrder("numDecks", order), { slug: "asc" }];
    case "name":
      return [{ name: order }, { slug: "asc" }];
    case "salt":
      return [nullableOrder("salt", order), { slug: "asc" }];
    case "inclusion":
    default:
      return [nullableOrder("inclusion", order), { slug: "asc" }];
  }
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

function buildPopularCursorWhere(cursor: CardBrowseCursor): Prisma.EdhrecCardDataWhereInput {
  const forwardPrimary = cursor.order === "asc" ? "gt" : "lt";
  const forwardTie = "gt";
  const slug = cursor.slug ?? "";

  switch (cursor.sort) {
    case "rank": {
      const inclusion = cursor.inclusion;
      const effectiveOrder = cursor.order === "asc" ? "desc" : "asc";
      const primary = effectiveOrder === "asc" ? "gt" : "lt";
      if (inclusion == null) return { slug: { [forwardTie]: slug } };
      return {
        OR: [
          { inclusion: { [primary]: inclusion } },
          { AND: [{ inclusion }, { slug: { [forwardTie]: slug } }] },
        ],
      };
    }
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
    case "inclusion":
    default: {
      const inclusion = cursor.inclusion;
      if (inclusion == null) return { slug: { [forwardTie]: slug } };
      return {
        OR: [
          { inclusion: { [forwardPrimary]: inclusion } },
          { AND: [{ inclusion }, { slug: { [forwardTie]: slug } }] },
        ],
      };
    }
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

function popularCursorPayload(
  row: CardBrowseItem,
  slug: string,
  sort: PopularCardSort,
  order: BrowseOrder,
  window: EdhrecCardTopWindowParam,
): CardBrowseCursor {
  return {
    tab: "popular",
    window,
    sort,
    order,
    slug,
    name: row.name,
    rank: row.rank,
    inclusion: row.inclusion,
    numDecks: row.numDecks,
    salt: row.salt,
  };
}

function allCursorPayload(row: CardBrowseItem, sort: AllCardSort, order: BrowseOrder): CardBrowseCursor {
  return {
    tab: "all",
    sort,
    order,
    id: row.id,
    name: row.name,
    cmc: row.cmc,
  };
}

export function parseCardBrowseParams(searchParams: URLSearchParams): CardBrowseParams {
  const tab = parseCardBrowseTab(searchParams.get("tab"));
  const window = parseCardTopWindowParam(searchParams.get("window"));
  const sort = parseCardBrowseSort(tab, searchParams.get("sort"));
  const hasEdhrecParam = searchParams.get("has_edhrec");

  return {
    tab,
    window,
    limit: parseBrowseLimit(searchParams.get("limit")),
    cursor: searchParams.get("cursor"),
    sort,
    order: parseBrowseOrder(searchParams.get("order"), defaultOrderForCardBrowseTab(tab, sort)),
    filters: {
      query: searchParams.get("q")?.trim() || undefined,
      colors: parseBrowseColorsParam(searchParams.get("color")),
      cmcMin: parseBrowseOptionalNumber(searchParams.get("cmc_min")),
      cmcMax: parseBrowseOptionalNumber(searchParams.get("cmc_max")),
      typeContains: searchParams.get("type")?.trim() || undefined,
      commanderLegal: searchParams.get("commander") === "legal",
      commandersOnly: searchParams.get("commanders_only") === "true",
      rarities: parseRaritiesParam(searchParams.get("rarity")),
      hasEdhrec:
        hasEdhrecParam === "true" ? true : hasEdhrecParam === "false" ? false : undefined,
    },
  };
}

async function queryPopularFromTopIndex(
  prisma: PrismaClient,
  params: CardBrowseParams,
  window: EdhrecCardTopWindowParam,
): Promise<BrowseListResponse<CardBrowseItem> | null> {
  const hasEntries = await topIndexHasEntries(prisma, EdhrecTopEntityType.CARD, window);
  if (!hasEntries) {
    return null;
  }

  const sort = (params.sort ?? "rank") as PopularCardSort;
  const order = params.order ?? defaultOrderForTab(sort);
  const limit = params.limit ?? parseBrowseLimit(null);
  const filters = params.filters ?? {};

  const decoded = decodeBrowseCursor<CardBrowseCursor>(params.cursor);
  if (
    decoded &&
    (decoded.tab !== "popular" ||
      decoded.sort !== sort ||
      decoded.order !== order ||
      (decoded.window ?? DEFAULT_EDHREC_CARD_TOP_WINDOW) !== window)
  ) {
    throw new Error("Cursor does not match tab/sort/order/window parameters");
  }

  const topEntries = filterTopEntriesByQuery(
    await loadTopEntryRows(prisma, EdhrecTopEntityType.CARD, window),
    filters.query,
  );

  const cards = await prisma.card.findMany({
    where: {
      ...(await buildPopularCardWhere(prisma, filters)),
      edhrecSlug: { in: topEntries.map((entry) => entry.slug) },
    },
    select: {
      ...cardBrowseSelect,
      edhrecCardData: {
        select: {
          slug: true,
          salt: true,
          numDecks: true,
          inclusion: true,
          potentialDecks: true,
        },
      },
    },
  });

  const cardBySlug = new Map(
    cards
      .filter((card) => card.edhrecSlug)
      .map((card) => [card.edhrecSlug as string, card]),
  );

  type EnrichedTopEntry = (typeof topEntries)[number] & { salt: number | null };

  const sortField =
    sort === "name"
      ? "name"
      : sort === "numDecks"
        ? "numDecks"
        : sort === "salt"
          ? "salt"
          : sort === "rank"
            ? "rank"
            : "inclusion";

  let enriched: EnrichedTopEntry[] = topEntries
    .filter((entry) => cardBySlug.has(entry.slug))
    .map((entry) => ({
      ...entry,
      salt: cardBySlug.get(entry.slug)?.edhrecCardData?.salt ?? null,
    }));

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
        inclusion: decoded.inclusion,
        salt: decoded.salt,
      },
    );
  }

  const items: CardBrowseItem[] = enriched.slice(0, limit + 1).map((entry) => {
    const card = cardBySlug.get(entry.slug)!;

    return {
      id: card.id,
      name: card.name,
      edhrecSlug: card.edhrecSlug,
      typeLine: card.typeLine,
      cmc: card.cmc,
      colorIdentity: card.colorIdentity,
      imageUri: card.imageUri,
      isCommander: card.isCommander,
      hasEdhrecData: card.edhrecCardData != null,
      rank: entry.rank,
      salt: entry.salt,
      numDecks: entry.numDecks ?? card.edhrecCardData?.numDecks ?? null,
      inclusion: entry.inclusion ?? card.edhrecCardData?.inclusion ?? null,
      potentialDecks: entry.potentialDecks ?? card.edhrecCardData?.potentialDecks ?? null,
    };
  });

  const response = buildBrowseListResponse(items, limit, total, (item) => {
    const slug = item.edhrecSlug ?? item.id;
    return popularCursorPayload(item, slug, sort, order, window);
  });

  return {
    ...response,
    meta: {
      popularityDataAvailable: true,
      window,
    },
  };
}

async function queryPopularCardsBrowseLegacy(
  prisma: PrismaClient,
  params: CardBrowseParams,
  window: EdhrecCardTopWindowParam,
): Promise<BrowseListResponse<CardBrowseItem>> {
  const sort = (params.sort ?? "rank") as PopularCardSort;
  const order = params.order ?? defaultOrderForTab(sort);
  const limit = params.limit ?? parseBrowseLimit(null);
  const filters = params.filters ?? {};
  const baseWhere = await buildPopularWhere(prisma, filters);

  const decoded = decodeBrowseCursor<CardBrowseCursor>(params.cursor);
  if (decoded && (decoded.tab !== "popular" || decoded.sort !== sort || decoded.order !== order)) {
    throw new Error("Cursor does not match tab/sort/order parameters");
  }

  const total = await prisma.edhrecCardData.count({ where: baseWhere });
  const cursorWhere = decoded ? buildPopularCursorWhere(decoded) : undefined;
  const where: Prisma.EdhrecCardDataWhereInput = cursorWhere
    ? { AND: [baseWhere, cursorWhere] }
    : baseWhere;

  const rows = await prisma.edhrecCardData.findMany({
    where,
    orderBy: getPopularOrderBy(sort, order),
    take: limit + 1,
    select: {
      slug: true,
      name: true,
      salt: true,
      numDecks: true,
      inclusion: true,
      potentialDecks: true,
      card: { select: cardBrowseSelect },
    },
  });

  const mapped = rows
    .map((row) => {
      const item = mapPopularRow(row);
      return item ? { item, slug: row.slug } : null;
    })
    .filter((entry): entry is { item: CardBrowseItem; slug: string } => entry != null);

  const startRank = decoded?.rank != null ? decoded.rank + 1 : 1;
  const itemsWithRank = mapped.map((entry, index) => ({
    ...entry,
    item: {
      ...entry.item,
      rank: startRank + index,
    },
  }));

  return {
    ...buildBrowseListResponse(
      itemsWithRank.map((entry) => entry.item),
      limit,
      total,
      (item) => {
        const slug =
          itemsWithRank.find((entry) => entry.item.id === item.id)?.slug ??
          item.edhrecSlug ??
          item.id;
        return popularCursorPayload(item, slug, sort, order, window);
      },
    ),
    meta: {
      popularityDataAvailable: false,
      window,
    },
  };
}

async function queryPopularCardsBrowse(
  prisma: PrismaClient,
  params: CardBrowseParams,
): Promise<BrowseListResponse<CardBrowseItem>> {
  const window = params.window ?? DEFAULT_EDHREC_CARD_TOP_WINDOW;

  const fromTopIndex = await queryPopularFromTopIndex(prisma, params, window);

  if (fromTopIndex) {
    return fromTopIndex;
  }

  return queryPopularCardsBrowseLegacy(prisma, params, window);
}

async function queryAllCardsBrowse(
  prisma: PrismaClient,
  params: CardBrowseParams,
): Promise<BrowseListResponse<CardBrowseItem>> {
  const sort = (params.sort ?? "name") as AllCardSort;
  const order = params.order ?? "asc";
  const limit = params.limit ?? parseBrowseLimit(null);
  const filters = params.filters ?? {};
  const baseWhere = await applyRarityOracleFilter(prisma, buildAllWhere(filters), filters.rarities);

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

export async function queryCardsBrowse(
  prisma: PrismaClient,
  params: CardBrowseParams,
): Promise<BrowseListResponse<CardBrowseItem>> {
  const tab = params.tab ?? "popular";

  if (tab === "all") {
    return queryAllCardsBrowse(prisma, params);
  }

  return queryPopularCardsBrowse(prisma, params);
}
