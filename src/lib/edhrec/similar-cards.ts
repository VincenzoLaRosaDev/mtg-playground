import type { PrismaClient } from "@/generated/prisma/client";

import { toEdhrecSlug } from "@/lib/scryfall/card-utils";

export type SimilarCardItem = {
  slug: string;
  name: string;
  imageUri: string | null;
  prices: unknown;
  salt: number | null;
  numDecks: number | null;
  inclusion: number | null;
  potentialDecks: number | null;
};

export async function loadSimilarCards(
  prisma: PrismaClient,
  names: string[],
  limit = 8,
): Promise<SimilarCardItem[]> {
  const uniqueNames = [...new Set(names.map((name) => name.trim()).filter(Boolean))].slice(
    0,
    limit,
  );

  if (uniqueNames.length === 0) {
    return [];
  }

  const slugByName = new Map(
    uniqueNames
      .map((name) => [name, toEdhrecSlug(name)] as const)
      .filter(([, slug]) => Boolean(slug)),
  );
  const slugs = [...new Set(slugByName.values())];

  const [cards, cardDataRows] = await Promise.all([
    prisma.card.findMany({
      where: { edhrecSlug: { in: slugs } },
      select: {
        edhrecSlug: true,
        name: true,
        imageUri: true,
        prices: true,
      },
    }),
    prisma.edhrecCardData.findMany({
      where: { slug: { in: slugs } },
      select: {
        slug: true,
        name: true,
        salt: true,
        numDecks: true,
        inclusion: true,
        potentialDecks: true,
      },
    }),
  ]);

  const cardBySlug = new Map(
    cards
      .filter((card) => card.edhrecSlug)
      .map((card) => [card.edhrecSlug as string, card]),
  );
  const cardDataBySlug = new Map(cardDataRows.map((row) => [row.slug, row]));

  return uniqueNames
    .map((name) => {
      const slug = slugByName.get(name);

      if (!slug) {
        return null;
      }

      const card = cardBySlug.get(slug);
      const cardData = cardDataBySlug.get(slug);

      return {
        slug,
        name: card?.name ?? cardData?.name ?? name,
        imageUri: card?.imageUri ?? null,
        prices: card?.prices ?? null,
        salt: cardData?.salt ?? null,
        numDecks: cardData?.numDecks ?? null,
        inclusion: cardData?.inclusion ?? null,
        potentialDecks: cardData?.potentialDecks ?? null,
      };
    })
    .filter((item): item is SimilarCardItem => item != null);
}
