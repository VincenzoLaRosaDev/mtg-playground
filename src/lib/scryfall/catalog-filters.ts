import type { Prisma, PrismaClient } from "@/generated/prisma/client";

import type { ScryfallCard } from "@/lib/scryfall/types";

/** Scryfall layouts excluded from the Commander play catalog (collectibles, not game cards). */
export const EXCLUDED_CATALOG_LAYOUTS = ["art_series"] as const;

export type ExcludedCatalogLayout = (typeof EXCLUDED_CATALOG_LAYOUTS)[number];

export function isExcludedCatalogLayout(layout: string): boolean {
  return (EXCLUDED_CATALOG_LAYOUTS as readonly string[]).includes(layout);
}

export function shouldIndexScryfallCard(card: Pick<ScryfallCard, "layout">): boolean {
  return !isExcludedCatalogLayout(card.layout);
}

/** Prisma filter for user-facing card queries and EDHREC card resolution. */
export const playableCatalogCardWhere: Prisma.CardWhereInput = {
  layout: { notIn: [...EXCLUDED_CATALOG_LAYOUTS] },
};

type CardLookupClient = Pick<PrismaClient, "card">;

/**
 * Resolve slug → playable catalog row when multiple oracle cards share an EDHREC slug
 * (e.g. before art_series purge, or generic token names).
 */
export async function findPlayableCardByEdhrecSlug<T extends Prisma.CardSelect>(
  db: CardLookupClient,
  slug: string,
  select: T,
): Promise<Prisma.CardGetPayload<{ select: T }> | null> {
  const baseWhere: Prisma.CardWhereInput = {
    edhrecSlug: slug,
    ...playableCatalogCardWhere,
  };

  const commander = await db.card.findFirst({
    where: { ...baseWhere, isCommander: true },
    orderBy: { name: "asc" },
    select,
  });

  if (commander) {
    return commander;
  }

  return db.card.findFirst({
    where: baseWhere,
    orderBy: [{ isCommander: "desc" }, { name: "asc" }],
    select,
  });
}

export async function resolvePlayableCardId(
  db: CardLookupClient,
  slug: string,
): Promise<string | null> {
  const card = await findPlayableCardByEdhrecSlug(db, slug, { id: true });
  return card?.id ?? null;
}
