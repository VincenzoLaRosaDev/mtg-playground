import type { PrismaClient } from "@/generated/prisma/client";

import { commanderAllTimeRank } from "@/lib/edhrec/commander-rank";

export type SimilarCommanderItem = {
  slug: string;
  name: string;
  rank: number | null;
  numDecks: number | null;
  salt: number | null;
  imageUri: string | null;
  prices: unknown;
};

export async function loadSimilarCommanders(
  prisma: PrismaClient,
  slugs: string[],
  limit = 8,
): Promise<SimilarCommanderItem[]> {
  const uniqueSlugs = [...new Set(slugs.filter(Boolean))].slice(0, limit);

  if (uniqueSlugs.length === 0) {
    return [];
  }

  const profiles = await prisma.edhrecCommanderProfile.findMany({
    where: { slug: { in: uniqueSlugs } },
    select: {
      slug: true,
      name: true,
      rank: true,
      numDecks: true,
      salt: true,
      card: {
        select: {
          imageUri: true,
          prices: true,
        },
      },
    },
  });

  const profileBySlug = new Map(profiles.map((profile) => [profile.slug, profile]));

  const cards = await prisma.card.findMany({
    where: { edhrecSlug: { in: uniqueSlugs } },
    select: {
      edhrecSlug: true,
      name: true,
      imageUri: true,
      prices: true,
    },
  });

  const cardBySlug = new Map(
    cards
      .filter((card) => card.edhrecSlug)
      .map((card) => [card.edhrecSlug as string, card]),
  );

  return uniqueSlugs.map((slug) => {
    const profile = profileBySlug.get(slug);
    const card = cardBySlug.get(slug);

    return {
      slug,
      name: profile?.name ?? card?.name ?? slug,
      rank: commanderAllTimeRank(profile),
      numDecks: profile?.numDecks ?? null,
      salt: profile?.salt ?? null,
      imageUri: profile?.card?.imageUri ?? card?.imageUri ?? null,
      prices: profile?.card?.prices ?? card?.prices ?? null,
    };
  });
}
