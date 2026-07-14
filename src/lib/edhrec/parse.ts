import { EdhrecSyncTier } from "@/generated/prisma/client";
import { toEdhrecSlug } from "@/lib/scryfall/card-utils";

import type { EdhrecCardPage, EdhrecCommanderPage } from "@/lib/edhrec/types";

const TIER_TTL_DAYS: Record<EdhrecSyncTier, number> = {
  [EdhrecSyncTier.HOT]: 7,
  [EdhrecSyncTier.WARM]: 7,
  [EdhrecSyncTier.COLD]: 30,
};

export function getTierExpiry(tier: EdhrecSyncTier, syncedAt = new Date()): Date {
  const expiresAt = new Date(syncedAt);
  expiresAt.setDate(expiresAt.getDate() + TIER_TTL_DAYS[tier]);
  return expiresAt;
}

export function getHotTierExpiry(syncedAt = new Date()): Date {
  return getTierExpiry(EdhrecSyncTier.HOT, syncedAt);
}

export function mapSimilarSlugs(similar: string[] | undefined): string[] {
  if (!similar?.length) {
    return [];
  }

  return [...new Set(similar.map((name) => toEdhrecSlug(name)).filter(Boolean))];
}

export function mapCardData(
  page: EdhrecCardPage,
  tier: EdhrecSyncTier = EdhrecSyncTier.HOT,
  syncedAt = new Date(),
) {
  const card = page.container.json_dict.card;

  return {
    slug: card.sanitized,
    name: card.name,
    salt: card.salt ?? null,
    numDecks: card.num_decks ?? null,
    inclusion: card.inclusion ?? null,
    potentialDecks: card.potential_decks ?? null,
    cardlists: page.container.json_dict.cardlists ?? {},
    similarCards: page.similar ?? [],
    syncTier: tier,
    syncedAt,
    expiresAt: getTierExpiry(tier, syncedAt),
  };
}

export function mapCommanderProfile(
  page: EdhrecCommanderPage,
  tier: EdhrecSyncTier = EdhrecSyncTier.HOT,
  syncedAt = new Date(),
) {
  const card = page.container.json_dict.card;

  return {
    slug: card.sanitized,
    name: card.name,
    rank: card.rank ?? null,
    salt: card.salt ?? null,
    numDecks: card.num_decks ?? null,
    colorIdentity: card.color_identity ?? [],
    tagCounts: page.tag_counts ?? {},
    similarSlugs: mapSimilarSlugs(page.similar),
    cardlists: page.container.json_dict.cardlists ?? {},
    // Write-only until bracket/budget UI (Phase 2+); not read in app today.
    bracketCounts: page.bracket_counts ?? undefined,
    budgetCounts: page.budget_counts ?? undefined,
    syncTier: tier,
    syncedAt,
    expiresAt: getTierExpiry(tier, syncedAt),
  };
}

