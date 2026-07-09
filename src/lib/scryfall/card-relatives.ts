import { prisma } from "@/lib/db";

import { parseSubtypes, subtypeTypeLineFilter } from "@/lib/scryfall/type-utils";

const DEFAULT_LIMIT = 16;

export type CardRelative = {
  name: string;
  edhrecSlug: string | null;
  typeLine: string;
  imageUri: string | null;
  cmc: number;
};

export async function getCardRelativesBySubtype(
  card: { id: string; typeLine: string },
  limit = DEFAULT_LIMIT,
): Promise<{ subtypes: string[]; relatives: CardRelative[] }> {
  const subtypes = parseSubtypes(card.typeLine);

  if (subtypes.length === 0) {
    return { subtypes: [], relatives: [] };
  }

  const relatives = await prisma.card.findMany({
    where: {
      id: { not: card.id },
      legalities: {
        path: ["commander"],
        equals: "legal",
      },
      OR: subtypes.map((subtype) => subtypeTypeLineFilter(subtype)),
    },
    select: {
      name: true,
      edhrecSlug: true,
      typeLine: true,
      imageUri: true,
      cmc: true,
    },
    orderBy: { name: "asc" },
    take: limit,
  });

  return { subtypes, relatives };
}
