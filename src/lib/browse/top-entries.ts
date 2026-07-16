import type { PrismaClient } from "@/generated/prisma/client";
import {
  EdhrecTopEntityType,
} from "@/generated/prisma/client";

import type { BrowseOrder } from "@/lib/browse/types";
import { topWindowParamToEnum } from "@/lib/edhrec/top-window-db";
import type { EdhrecTopWindowParam } from "@/lib/edhrec/top-window";

export type TopEntryRow = {
  slug: string;
  name: string;
  rank: number;
  numDecks: number | null;
  inclusion: number | null;
  potentialDecks: number | null;
};

function isTopIndexUnavailableError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error.code === "P2021" || error.code === "P1014")
  );
}

export async function topIndexHasEntries(
  prisma: PrismaClient,
  entityType: EdhrecTopEntityType,
  window: EdhrecTopWindowParam,
): Promise<boolean> {
  try {
    const count = await prisma.edhrecTopEntry.count({
      where: {
        entityType,
        window: topWindowParamToEnum(window),
      },
    });

    return count > 0;
  } catch (error) {
    if (isTopIndexUnavailableError(error)) {
      return false;
    }

    throw error;
  }
}

export async function loadTopEntryRows(
  prisma: PrismaClient,
  entityType: EdhrecTopEntityType,
  window: EdhrecTopWindowParam,
): Promise<TopEntryRow[]> {
  try {
    const rows = await prisma.edhrecTopEntry.findMany({
      where: {
        entityType,
        window: topWindowParamToEnum(window),
      },
      orderBy: { rank: "asc" },
      select: {
        slug: true,
        name: true,
        rank: true,
        numDecks: true,
        inclusion: true,
        potentialDecks: true,
      },
    });

    return rows;
  } catch (error) {
    if (isTopIndexUnavailableError(error)) {
      return [];
    }

    throw error;
  }
}

export function filterTopEntriesByQuery(entries: TopEntryRow[], query?: string): TopEntryRow[] {
  if (!query || query.length < 2) {
    return entries;
  }

  const normalized = query.toLowerCase();

  return entries.filter(
    (entry) =>
      entry.name.toLowerCase().includes(normalized) ||
      entry.slug.includes(normalized),
  );
}

type TopSortField = "rank" | "numDecks" | "inclusion" | "name" | "salt";

export function sortTopEntries<T extends TopEntryRow>(
  entries: T[],
  sort: TopSortField,
  order: BrowseOrder,
  getSalt?: (entry: T) => number | null,
): T[] {
  const direction = order === "asc" ? 1 : -1;

  return [...entries].sort((left, right) => {
    let cmp = 0;

    switch (sort) {
      case "name":
        cmp = left.name.localeCompare(right.name) * direction;
        break;
      case "numDecks":
        cmp = compareNullableNullsLast(left.numDecks, right.numDecks, direction);
        break;
      case "inclusion":
        cmp = compareNullableNullsLast(left.inclusion, right.inclusion, direction);
        break;
      case "salt":
        cmp = compareNullableNullsLast(
          getSalt?.(left) ?? null,
          getSalt?.(right) ?? null,
          direction,
        );
        break;
      case "rank":
      default:
        cmp = (left.rank - right.rank) * direction;
        break;
    }

    if (cmp === 0) {
      cmp = left.rank - right.rank;
    }

    if (cmp === 0) {
      cmp = left.slug.localeCompare(right.slug);
    }

    return cmp;
  });
}

/** Null/missing metrics always sort after real values (asc and desc). */
function compareNullableNullsLast(
  left: number | null,
  right: number | null,
  direction: 1 | -1,
): number {
  if (left == null && right == null) return 0;
  if (left == null) return 1;
  if (right == null) return -1;
  return (left - right) * direction;
}

export function sliceAfterTopCursor<T extends TopEntryRow>(
  entries: T[],
  cursor: {
    sort: TopSortField;
    order: BrowseOrder;
    rank: number;
    slug: string;
    name?: string;
    numDecks?: number | null;
    inclusion?: number | null;
    salt?: number | null;
  },
): T[] {
  const index = entries.findIndex((entry) => entry.slug === cursor.slug && entry.rank === cursor.rank);

  if (index >= 0) {
    return entries.slice(index + 1);
  }

  return entries.filter((entry) => entry.rank > cursor.rank);
}
