import type { PrismaClient } from "@/generated/prisma/client";

import { toEdhrecSlug } from "@/lib/scryfall/card-utils";

export type SimilarCardItem = {
  slug: string;
  name: string;
  imageUri: string | null;
  typeLine: string | null;
};

export async function loadSimilarCards(
  prisma: PrismaClient,
  names: string[],
  limit = 8,
): Promise<SimilarCardItem[]> {
  const uniqueNames = [...new Set(names.map((name) => name.trim()).filter(Boolean))].slice(0, limit);

  if (uniqueNames.length === 0) {
    return [];
  }

  const slugByName = new Map(
    uniqueNames.map((name) => [name, toEdhrecSlug(name)] as const).filter(([, slug]) => Boolean(slug)),
  );
  const slugs = [...new Set(slugByName.values())];

  const cards = await prisma.card.findMany({
    where: { edhrecSlug: { in: slugs } },
    select: {
      edhrecSlug: true,
      name: true,
      imageUri: true,
      typeLine: true,
    },
  });

  const cardBySlug = new Map(
    cards
      .filter((card) => card.edhrecSlug)
      .map((card) => [card.edhrecSlug as string, card]),
  );

  return uniqueNames
    .map((name) => {
      const slug = slugByName.get(name);

      if (!slug) {
        return null;
      }

      const card = cardBySlug.get(slug);

      return {
        slug,
        name: card?.name ?? name,
        imageUri: card?.imageUri ?? null,
        typeLine: card?.typeLine ?? null,
      };
    })
    .filter((item): item is SimilarCardItem => item != null);
}
