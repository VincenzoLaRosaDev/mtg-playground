import type { Prisma } from "@/generated/prisma/client";

/** Subtypes from a Scryfall type line (segment after the em dash). */
export function parseSubtypes(typeLine: string): string[] {
  const dashIndex = typeLine.indexOf("—");
  if (dashIndex === -1) {
    return [];
  }

  return typeLine
    .slice(dashIndex + 1)
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

export function subtypeTypeLineFilter(subtype: string): Prisma.CardWhereInput {
  const marker = `— ${subtype}`;

  return {
    OR: [
      { typeLine: { endsWith: marker, mode: "insensitive" } },
      { typeLine: { contains: `${marker} `, mode: "insensitive" } },
    ],
  };
}

export function formatSubtypeList(subtypes: string[]): string {
  return subtypes.join(", ");
}
