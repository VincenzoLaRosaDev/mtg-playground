import { prisma } from "@/lib/db";

import { parseSubtypes, subtypeTypeLineFilter } from "@/lib/scryfall/type-utils";
import { playableCatalogCardWhere } from "@/lib/scryfall/catalog-filters";
import { parseCardFaces, type CardFaceImage } from "@/lib/scryfall/faces";

const DEFAULT_LIMIT = 16;

export type CardRelative = {
  name: string;
  slug: string | null;
  typeLine: string;
  imageUri: string | null;
  faces: CardFaceImage[];
  cmc: number;
  prices: unknown;
  popularityRank: number | null;
  frictionScore: number;
};

export async function getCardRelativesBySubtype(
  card: { id: string; typeLine: string },
  limit = DEFAULT_LIMIT,
): Promise<{ subtypes: string[]; relatives: CardRelative[] }> {
  const subtypes = parseSubtypes(card.typeLine);

  if (subtypes.length === 0) {
    return { subtypes: [], relatives: [] };
  }

  const rows = await prisma.card.findMany({
    where: {
      ...playableCatalogCardWhere,
      id: { not: card.id },
      legalities: {
        path: ["commander"],
        equals: "legal",
      },
      OR: subtypes.map((subtype) => subtypeTypeLineFilter(subtype)),
    },
    select: {
      name: true,
      slug: true,
      typeLine: true,
      imageUri: true,
      faces: true,
      cmc: true,
      prices: true,
      popularityRank: true,
      frictionScore: true,
    },
    orderBy: [{ popularityRank: { sort: "asc", nulls: "last" } }, { name: "asc" }],
    take: limit,
  });

  return {
    subtypes,
    relatives: rows.map((row) => ({
      name: row.name,
      slug: row.slug,
      typeLine: row.typeLine,
      imageUri: row.imageUri,
      faces: parseCardFaces(row.faces),
      cmc: row.cmc,
      prices: row.prices,
      popularityRank: row.popularityRank,
      frictionScore: row.frictionScore,
    })),
  };
}
