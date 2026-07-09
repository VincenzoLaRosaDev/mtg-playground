import type { Prisma } from "@/generated/prisma/client";

export const SET_RARITIES = ["common", "uncommon", "rare", "mythic", "special", "bonus"] as const;

export type SetCardFilters = {
  query?: string;
  rarities?: string[];
  colors?: string[];
  commanderLegal?: boolean;
};

export function parseSetCardFilters(searchParams: {
  q?: string;
  rarity?: string;
  color?: string;
  commander?: string;
}): SetCardFilters {
  return {
    query: searchParams.q?.trim() || undefined,
    rarities: searchParams.rarity
      ? searchParams.rarity.split(",").map((value) => value.trim().toLowerCase()).filter(Boolean)
      : undefined,
    colors: searchParams.color
      ? searchParams.color.split(",").map((value) => value.trim().toUpperCase()).filter(Boolean)
      : undefined,
    commanderLegal: searchParams.commander === "legal" ? true : undefined,
  };
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
