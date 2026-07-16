import type { PrismaClient } from "@/generated/prisma/client";

export type CatalogCardFace = {
  slug: string;
  name: string;
  imageUri: string | null;
  prices: unknown;
  /** From EDHREC card/commander cache — cardlist cardviews usually omit salt. */
  salt: number | null;
};

export async function loadCatalogCardFacesBySlugs(
  prisma: PrismaClient,
  slugs: string[],
): Promise<Map<string, CatalogCardFace>> {
  const uniqueSlugs = [...new Set(slugs.filter(Boolean))];

  if (uniqueSlugs.length === 0) {
    return new Map();
  }

  const [cards, cardDataRows, commanderProfiles] = await Promise.all([
    prisma.card.findMany({
      where: { edhrecSlug: { in: uniqueSlugs } },
      select: {
        edhrecSlug: true,
        name: true,
        imageUri: true,
        prices: true,
      },
    }),
    prisma.edhrecCardData.findMany({
      where: { slug: { in: uniqueSlugs } },
      select: { slug: true, salt: true, name: true },
    }),
    prisma.edhrecCommanderProfile.findMany({
      where: { slug: { in: uniqueSlugs } },
      select: { slug: true, salt: true, name: true },
    }),
  ]);

  const saltBySlug = new Map<string, number | null>();
  for (const row of cardDataRows) {
    saltBySlug.set(row.slug, row.salt);
  }
  for (const profile of commanderProfiles) {
    if (!saltBySlug.has(profile.slug) || saltBySlug.get(profile.slug) == null) {
      saltBySlug.set(profile.slug, profile.salt);
    }
  }

  const nameBySlug = new Map<string, string>();
  for (const row of cardDataRows) {
    nameBySlug.set(row.slug, row.name);
  }
  for (const profile of commanderProfiles) {
    if (!nameBySlug.has(profile.slug)) {
      nameBySlug.set(profile.slug, profile.name);
    }
  }

  const faces = new Map<string, CatalogCardFace>();

  for (const card of cards) {
    if (!card.edhrecSlug) {
      continue;
    }

    faces.set(card.edhrecSlug, {
      slug: card.edhrecSlug,
      name: card.name,
      imageUri: card.imageUri,
      prices: card.prices,
      salt: saltBySlug.get(card.edhrecSlug) ?? null,
    });
  }

  // Slugs with EDHREC salt but no catalog card still get a face stub for footer meta.
  for (const slug of uniqueSlugs) {
    if (faces.has(slug)) {
      continue;
    }

    const salt = saltBySlug.get(slug);
    if (salt == null && !nameBySlug.has(slug)) {
      continue;
    }

    faces.set(slug, {
      slug,
      name: nameBySlug.get(slug) ?? slug,
      imageUri: null,
      prices: null,
      salt: salt ?? null,
    });
  }

  return faces;
}
