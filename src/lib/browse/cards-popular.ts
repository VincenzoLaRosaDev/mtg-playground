import type { Prisma, PrismaClient } from "@/generated/prisma/client";
import { EdhrecSyncTier, EdhrecTopEntityType } from "@/generated/prisma/client";

import {
  applyRarityOracleFilter,
  buildCatalogCardWhere,
  cardBrowseSelect,
  type CardBrowseFilters,
} from "@/lib/browse/cards-filters";
import {
  popularCursorPayload,
  type CardBrowseCursor,
  type CardBrowseParams,
} from "@/lib/browse/cards-params";
import { type CardBrowseItem, type PopularCardSort, defaultOrderForTab } from "@/lib/browse/cards-shared";
import { decodeBrowseCursor } from "@/lib/browse/cursor";
import { parseBrowseLimit } from "@/lib/browse/params";
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
  type EdhrecCardTopWindowParam,
} from "@/lib/edhrec/top-window";

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
    enriched = sliceAfterTopCursor(enriched, {
      sort: sortField,
      order,
      rank: decoded.rank,
      slug: decoded.slug,
      name: decoded.name,
      numDecks: decoded.numDecks,
      inclusion: decoded.inclusion,
      salt: decoded.salt,
    });
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
      prices: card.prices,
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

export async function queryPopularCardsBrowse(
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
