import type { Prisma } from "@/generated/prisma/client";

export const MANA_COLOR_OPTIONS = ["W", "U", "B", "R", "G", "C"] as const;

export function toggleManaColorSelection(colors: string[], color: string): string[] {
  return colors.includes(color) ? colors.filter((value) => value !== color) : [...colors, color];
}

export function buildColorIdentityWhere(colors?: string[]): Prisma.CardWhereInput {
  if (!colors?.length) {
    return {};
  }

  const colorFilters: Prisma.CardWhereInput[] = [
    { colorIdentity: { hasSome: colors.filter((color) => color !== "C") } },
  ];

  if (colors.includes("C")) {
    colorFilters.push({ colorIdentity: { equals: [] } });
  }

  return { OR: colorFilters };
}

export function colorsToParam(colors: string[]): string | undefined {
  return colors.length > 0 ? colors.join(",") : undefined;
}

export function parseColorsFromParam(value: string | null | undefined): string[] {
  if (!value?.trim()) {
    return [];
  }

  return value
    .split(",")
    .map((entry) => entry.trim().toUpperCase())
    .filter(Boolean);
}
