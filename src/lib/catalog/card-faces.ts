import type { PrismaClient } from "@/generated/prisma/client";

export type CatalogCardFace = {
  slug: string;
  name: string;
  imageUri: string | null;
  prices: unknown;
};

export async function loadCatalogCardFacesBySlugs(
  prisma: PrismaClient,
  slugs: string[],
): Promise<Map<string, CatalogCardFace>> {
  const uniqueSlugs = [...new Set(slugs.filter(Boolean))];

  if (uniqueSlugs.length === 0) {
    return new Map();
  }

  const cards = await prisma.card.findMany({
    where: { slug: { in: uniqueSlugs } },
    select: {
      slug: true,
      name: true,
      imageUri: true,
      prices: true,
    },
  });

  const faces = new Map<string, CatalogCardFace>();

  for (const card of cards) {
    if (!card.slug) {
      continue;
    }

    faces.set(card.slug, {
      slug: card.slug,
      name: card.name,
      imageUri: card.imageUri,
      prices: card.prices,
    });
  }

  return faces;
}
