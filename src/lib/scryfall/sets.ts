import type { Prisma } from "@/generated/prisma/client";

import type { SetCardSort, SetCardSortOrder } from "@/lib/scryfall/set-card-sort";
import {
  defaultSetCardOrder,
  defaultSetCardSort,
  parseSetCardSort,
  parseSetCardSortOrder,
} from "@/lib/scryfall/set-card-sort";

export const SET_RARITIES = ["common", "uncommon", "rare", "mythic", "special", "bonus"] as const;

export type SetCardFilters = {
  query?: string;
  rarities?: string[];
  colors?: string[];
  commanderLegal?: boolean;
  typeContains?: string;
  cmcMin?: number;
  cmcMax?: number;
  sort?: SetCardSort;
  order?: SetCardSortOrder;
};

export function parseSetCardFilters(searchParams: {
  q?: string;
  rarity?: string;
  color?: string;
  commander?: string;
  type?: string;
  cmc_min?: string;
  cmc_max?: string;
  sort?: string;
  order?: string;
}): SetCardFilters {
  const sort = parseSetCardSort(searchParams.sort);

  return {
    query: searchParams.q?.trim() || undefined,
    rarities: searchParams.rarity
      ? searchParams.rarity.split(",").map((value) => value.trim().toLowerCase()).filter(Boolean)
      : undefined,
    colors: searchParams.color
      ? searchParams.color.split(",").map((value) => value.trim().toUpperCase()).filter(Boolean)
      : undefined,
    commanderLegal: searchParams.commander === "legal" ? true : undefined,
    typeContains: searchParams.type?.trim() || undefined,
    cmcMin: searchParams.cmc_min ? Number(searchParams.cmc_min) : undefined,
    cmcMax: searchParams.cmc_max ? Number(searchParams.cmc_max) : undefined,
    sort,
    order: parseSetCardSortOrder(searchParams.order),
  };
}

export function resolvedSetCardSort(filters: SetCardFilters): SetCardSort {
  return filters.sort ?? defaultSetCardSort();
}

export function resolvedSetCardOrder(filters: SetCardFilters): SetCardSortOrder {
  if (filters.order) return filters.order;
  return defaultSetCardOrder(resolvedSetCardSort(filters));
}

export function buildSetCardWhere(
  setCode: string,
  filters: SetCardFilters,
  matchingOracleIds?: string[],
): Prisma.SetCardWhereInput {
  const where: Prisma.SetCardWhereInput = { setCode };

  if (filters.rarities?.length) {
    where.rarity = { in: filters.rarities };
  }

  if (filters.query) {
    where.name = { contains: filters.query, mode: "insensitive" };
  }

  if (matchingOracleIds) {
    where.oracleId = { in: matchingOracleIds };
  }

  return where;
}

export function formatSetType(setType: string): string {
  return setType.replace(/_/g, " ");
}

export function formatReleaseDate(date: Date | null): string {
  if (!date) {
    return "Unknown";
  }

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
