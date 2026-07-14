import type { PrismaClient } from "@/generated/prisma/client";

export type CatalogCardFace = {
  slug: string;
  name: string;
  imageUri: string | null;
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
    where: { edhrecSlug: { in: uniqueSlugs } },
    select: {
      edhrecSlug: true,
      name: true,
      imageUri: true,
    },
  });

  return new Map(
    cards
      .filter((card) => card.edhrecSlug)
      .map((card) => [
        card.edhrecSlug as string,
        {
          slug: card.edhrecSlug as string,
          name: card.name,
          imageUri: card.imageUri,
        },
      ]),
  );
}
