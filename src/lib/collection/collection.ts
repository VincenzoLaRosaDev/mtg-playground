import type { Prisma, PrismaClient } from "@/generated/prisma/client";
import {
  decodeBrowseCursor,
  encodeBrowseCursor,
} from "@/lib/browse/cursor";
import type { BrowseOrder } from "@/lib/browse/types";
import type {
  CollectionFacets,
  CollectionFilter,
} from "@/lib/collection/collection-filters";
import {
  buildCollectionItemWhere,
  resolveCollectionOracleIds,
} from "@/lib/collection/collection-filters-server";
import {
  collectorNumberSortKey,
  collectionSortNeedsInMemory,
  defaultCollectionOrder,
  defaultCollectionSort,
  parseCollectionListPrice,
  type CollectionSort,
} from "@/lib/collection/collection-sort";
import {
  parsePrintingFinish,
  type PrintingFinish,
} from "@/lib/scryfall/card-printing";
import { parseCardFaces, type CardFaceImage } from "@/lib/scryfall/faces";

export type { CollectionFilter } from "@/lib/collection/collection-filters";

export const COLLECTION_PAGE_SIZE = 48;

export type CollectionListItem = {
  id: string;
  printingId: string;
  finish: PrintingFinish;
  quantity: number;
  wantlist: boolean;
  /** Owned tiles: whether a separate wish row exists for this printing+finish. */
  hasWishSibling: boolean;
  name: string;
  slug: string | null;
  setCode: string;
  setName: string;
  collectorNumber: string;
  imageUri: string | null;
  faces: CardFaceImage[];
  prices: unknown;
  cmc: number;
  colorSort: number;
};

export type CollectionListParams = CollectionFacets & {
  filter?: CollectionFilter;
  sort?: CollectionSort;
  order?: BrowseOrder;
  cursor?: string | null;
  limit?: number;
};

export type CollectionListResult = {
  items: CollectionListItem[];
  total: number;
  nextCursor: string | null;
};

type CollectionCursor = {
  id: string;
  sort: CollectionSort;
  order: BrowseOrder;
};

export function parseCollectionFilter(
  value: string | null | undefined,
): CollectionFilter {
  if (value === "owned" || value === "wantlist") return value;
  return "all";
}

function collectionScopeWhere(
  filter: CollectionFilter,
): Prisma.CollectionItemWhereInput {
  if (filter === "owned") {
    return { wantlist: false, quantity: { gt: 0 } };
  }
  if (filter === "wantlist") {
    return { wantlist: true, quantity: { gt: 0 } };
  }
  return { quantity: { gt: 0 } };
}

function collectionOrderBy(
  sort: CollectionSort,
  order: BrowseOrder,
): Prisma.CollectionItemOrderByWithRelationInput[] {
  switch (sort) {
    case "created":
      return [{ createdAt: order }, { id: "asc" }];
    case "name":
      return [{ printing: { name: order } }, { id: "asc" }];
    case "set":
      return [
        { printing: { setCode: order } },
        { printing: { collectorNumber: order } },
        { id: "asc" },
      ];
    case "price":
    case "cmc":
    case "color":
      return [{ updatedAt: "desc" }, { id: "asc" }];
    case "updated":
    default:
      return [{ updatedAt: order }, { id: "asc" }];
  }
}

function sortItemsInMemory(
  items: CollectionListItem[],
  sort: CollectionSort,
  order: BrowseOrder,
): CollectionListItem[] {
  if (!collectionSortNeedsInMemory(sort)) {
    return items;
  }

  const direction = order === "asc" ? 1 : -1;
  return [...items].sort((a, b) => {
    if (sort === "price") {
      const priceA = parseCollectionListPrice(a.prices, a.finish);
      const priceB = parseCollectionListPrice(b.prices, b.finish);
      if (priceA == null && priceB == null) return a.id.localeCompare(b.id);
      if (priceA == null) return 1;
      if (priceB == null) return -1;
      if (priceA !== priceB) return (priceA - priceB) * direction;
      return a.id.localeCompare(b.id);
    }

    if (sort === "cmc") {
      if (a.cmc !== b.cmc) return (a.cmc - b.cmc) * direction;
      const nameCmp = a.name.localeCompare(b.name);
      if (nameCmp !== 0) return nameCmp;
      return a.id.localeCompare(b.id);
    }

    if (sort === "color") {
      if (a.colorSort !== b.colorSort) {
        return (a.colorSort - b.colorSort) * direction;
      }
      if (a.cmc !== b.cmc) return a.cmc - b.cmc;
      const nameCmp = a.name.localeCompare(b.name);
      if (nameCmp !== 0) return nameCmp;
      return a.id.localeCompare(b.id);
    }

    const setCmp = a.setCode.localeCompare(b.setCode) * direction;
    if (setCmp !== 0) return setCmp;
    const cnCmp =
      collectorNumberSortKey(a.collectorNumber).localeCompare(
        collectorNumberSortKey(b.collectorNumber),
      ) * direction;
    if (cnCmp !== 0) return cnCmp;
    return a.id.localeCompare(b.id);
  });
}

/**
 * Paginated collection list.
 * Filtered set is always user-scoped; light rows are sorted then sliced by cursor.
 */
export async function listCollectionItems(
  prisma: PrismaClient,
  userId: string,
  params: CollectionListParams | CollectionFilter = "all",
): Promise<CollectionListResult> {
  const normalized: CollectionListParams =
    typeof params === "string" ? { filter: params } : params;
  const filter = normalized.filter ?? "all";
  const sort = normalized.sort ?? defaultCollectionSort();
  const order = normalized.order ?? defaultCollectionOrder(sort);
  const limit = Math.min(
    Math.max(1, Math.floor(normalized.limit ?? COLLECTION_PAGE_SIZE)),
    100,
  );

  const facets: CollectionFacets = {
    query: normalized.query,
    colors: normalized.colors,
    rarities: normalized.rarities,
    typeContains: normalized.typeContains,
    cmcMin: normalized.cmcMin,
    cmcMax: normalized.cmcMax,
    format: normalized.format,
    finishes: normalized.finishes,
    setQuery: normalized.setQuery,
  };

  const matchingOracleIds = await resolveCollectionOracleIds(
    prisma,
    userId,
    facets,
  );

  const where = buildCollectionItemWhere(
    userId,
    collectionScopeWhere(filter),
    facets,
    matchingOracleIds,
  );

  const total = await prisma.collectionItem.count({ where });
  if (total === 0) {
    return { items: [], total: 0, nextCursor: null };
  }

  const decoded = decodeBrowseCursor<CollectionCursor>(normalized.cursor);
  if (decoded && (decoded.sort !== sort || decoded.order !== order)) {
    throw new Error("Cursor does not match sort/order parameters");
  }

  const rows = await prisma.collectionItem.findMany({
    where,
    select: {
      id: true,
      printingId: true,
      finish: true,
      quantity: true,
      wantlist: true,
      printing: {
        select: {
          name: true,
          setCode: true,
          collectorNumber: true,
          imageUri: true,
          faces: true,
          prices: true,
          oracleId: true,
          set: { select: { name: true } },
        },
      },
    },
    orderBy: collectionOrderBy(sort, order),
  });

  const oracleIds = [...new Set(rows.map((row) => row.printing.oracleId))];
  const cards = await prisma.card.findMany({
    where: { oracleId: { in: oracleIds } },
    select: { oracleId: true, slug: true, cmc: true, colorSort: true },
  });
  const cardByOracle = new Map(
    cards.map((card) => [
      card.oracleId,
      { slug: card.slug, cmc: card.cmc, colorSort: card.colorSort },
    ]),
  );

  const ownedPairs = rows
    .filter((row) => !row.wantlist)
    .map((row) => ({ printingId: row.printingId, finish: row.finish }));
  const wishSiblingKeys = new Set<string>();
  if (ownedPairs.length > 0) {
    const wishRows = await prisma.collectionItem.findMany({
      where: {
        userId,
        wantlist: true,
        OR: ownedPairs.map((pair) => ({
          printingId: pair.printingId,
          finish: pair.finish,
        })),
      },
      select: { printingId: true, finish: true },
    });
    for (const wish of wishRows) {
      wishSiblingKeys.add(`${wish.printingId}\0${wish.finish}`);
    }
  }

  let items: CollectionListItem[] = rows.flatMap((row) => {
    const finish = parsePrintingFinish(row.finish);
    if (!finish) return [];
    const card = cardByOracle.get(row.printing.oracleId);
    return [
      {
        id: row.id,
        printingId: row.printingId,
        finish,
        quantity: row.quantity,
        wantlist: row.wantlist,
        hasWishSibling: wishSiblingKeys.has(`${row.printingId}\0${row.finish}`),
        name: row.printing.name,
        slug: card?.slug ?? null,
        setCode: row.printing.setCode,
        setName: row.printing.set.name,
        collectorNumber: row.printing.collectorNumber,
        imageUri: row.printing.imageUri,
        faces: parseCardFaces(row.printing.faces),
        prices: row.printing.prices as unknown,
        cmc: card?.cmc ?? 0,
        colorSort: card?.colorSort ?? 0,
      } satisfies CollectionListItem,
    ];
  });

  items = sortItemsInMemory(items, sort, order);

  let start = 0;
  if (decoded?.id) {
    const idx = items.findIndex((item) => item.id === decoded.id);
    start = idx >= 0 ? idx + 1 : 0;
  }

  const page = items.slice(start, start + limit + 1);
  const hasMore = page.length > limit;
  const visible = hasMore ? page.slice(0, limit) : page;
  const last = visible[visible.length - 1];
  const nextCursor =
    hasMore && last
      ? encodeBrowseCursor({
          id: last.id,
          sort,
          order,
        } satisfies CollectionCursor)
      : null;

  return { items: visible, total, nextCursor };
}

export async function assertPrintingFinish(
  prisma: PrismaClient,
  printingId: string,
  finish: PrintingFinish,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const printing = await prisma.printing.findUnique({
    where: { id: printingId },
    select: { finishes: true },
  });
  if (!printing) {
    return { ok: false, error: "Printing not found." };
  }
  if (!printing.finishes.includes(finish)) {
    return {
      ok: false,
      error: `Finish "${finish}" is not available for this printing.`,
    };
  }
  return { ok: true };
}
