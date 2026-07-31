import type { Prisma, PrismaClient } from "@/generated/prisma/client";

import type { ScryfallCard } from "@/lib/scryfall/types";

/**
 * Layouts never written to `cards` during oracle sync (collectibles).
 * Tokens/emblems stay indexed for Tokens & Extras relation art.
 */
export const EXCLUDED_SYNC_LAYOUTS = ["art_series"] as const;

/**
 * Layouts hidden from browse / hub search / detail packs.
 * Tokens/emblems remain queryable for relation resolution.
 */
export const EXCLUDED_BROWSE_LAYOUTS = [
  "art_series",
  "token",
  "double_faced_token",
  "emblem",
] as const;

/** @deprecated Prefer EXCLUDED_SYNC_LAYOUTS / EXCLUDED_BROWSE_LAYOUTS. */
export const EXCLUDED_CATALOG_LAYOUTS = EXCLUDED_SYNC_LAYOUTS;

export type ExcludedCatalogLayout = (typeof EXCLUDED_SYNC_LAYOUTS)[number];

export function isExcludedCatalogLayout(layout: string): boolean {
  return (EXCLUDED_SYNC_LAYOUTS as readonly string[]).includes(layout);
}

export function isExcludedBrowseLayout(layout: string): boolean {
  return (EXCLUDED_BROWSE_LAYOUTS as readonly string[]).includes(layout);
}

export function shouldIndexScryfallCard(card: Pick<ScryfallCard, "layout">): boolean {
  return !isExcludedCatalogLayout(card.layout);
}

/** Prisma filter for user-facing browse / discovery queries. */
export const playableCatalogCardWhere: Prisma.CardWhereInput = {
  layout: { notIn: [...EXCLUDED_BROWSE_LAYOUTS] },
};

/** Prisma filter that includes token/emblem oracles (relation art). */
export const catalogCardWhereIncludingTokens: Prisma.CardWhereInput = {
  layout: { notIn: [...EXCLUDED_SYNC_LAYOUTS] },
};

type CardLookupClient = Pick<PrismaClient, "card">;

/**
 * Resolve slug → playable catalog row when multiple oracle cards share a slug
 * (e.g. before art_series purge). Tokens are excluded from this path.
 */
export async function findPlayableCardBySlug<T extends Prisma.CardSelect>(
  db: CardLookupClient,
  slug: string,
  select: T,
): Promise<Prisma.CardGetPayload<{ select: T }> | null> {
  const baseWhere: Prisma.CardWhereInput = {
    slug,
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
  const card = await findPlayableCardBySlug(db, slug, { id: true });
  return card?.id ?? null;
}

/**
 * Resolve slug including token/emblem oracles (Tokens & Extras detail).
 */
export async function findCatalogCardBySlugIncludingTokens<
  T extends Prisma.CardSelect,
>(
  db: CardLookupClient,
  slug: string,
  select: T,
): Promise<Prisma.CardGetPayload<{ select: T }> | null> {
  return db.card.findFirst({
    where: { slug, ...catalogCardWhereIncludingTokens },
    orderBy: [{ isCommander: "desc" }, { name: "asc" }],
    select,
  });
}
