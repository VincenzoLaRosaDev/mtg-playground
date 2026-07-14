import {
  EdhrecPageEntityType,
  EdhrecSyncTier,
  type Prisma,
} from "@/generated/prisma/client";

import { prisma } from "@/lib/db";
import { fetchJson } from "@/lib/edhrec/client";
import { getTierExpiry } from "@/lib/edhrec/parse";
import type { CardlistsInput } from "@/lib/edhrec/cardlists";
import {
  mapCardPageToVariantPayload,
  mapCommanderPageToVariantPayload,
  type CardVariantPayload,
  type CommanderVariantPayload,
} from "@/lib/edhrec/variant-payload";
import {
  buildEdhrecPageUrl,
  hasActivePageFilters,
  normalizePageFilters,
  type EdhrecPageFilters,
} from "@/lib/edhrec/variants";
import { getUnsupportedCommanderFilterMessage } from "@/lib/edhrec/filter-options";
import type { EdhrecCardPage, EdhrecCommanderPage } from "@/lib/edhrec/types";

const VARIANT_TTL_TIER = EdhrecSyncTier.WARM;

export type EdhrecCacheOptions = {
  warm?: boolean;
  filters?: EdhrecPageFilters;
};

export type EdhrecCacheResult<T> = {
  data: T | null;
  isStale: boolean;
  syncedAt: Date | null;
  syncTier: EdhrecSyncTier | null;
  isVariant: boolean;
};

export type CommanderDetailData = {
  slug: string;
  name: string;
  rank: number | null;
  salt: number | null;
  numDecks: number | null;
  colorIdentity: string[];
  tagCounts: Record<string, number>;
  similarSlugs: string[];
  cardlists: CardlistsInput;
};

export type CardDetailEdhrecData = {
  slug: string;
  name: string;
  salt: number | null;
  numDecks: number | null;
  inclusion: number | null;
  potentialDecks: number | null;
  cardlists: CardlistsInput;
  similarCards: string[];
};

function isFresh(expiresAt: Date | null | undefined): boolean {
  return expiresAt != null && expiresAt > new Date();
}

function toCacheResult<T>(
  data: T | null,
  isStale: boolean,
  syncedAt: Date | null,
  syncTier: EdhrecSyncTier | null,
  isVariant: boolean,
): EdhrecCacheResult<T> {
  return { data, isStale, syncedAt, syncTier, isVariant };
}

async function fetchCommanderVariant(
  slug: string,
  filters: EdhrecPageFilters,
): Promise<CommanderVariantPayload | null> {
  const page = await fetchJson<EdhrecCommanderPage>(
    buildEdhrecPageUrl(EdhrecPageEntityType.COMMANDER, slug, filters),
  );

  if (!page?.container?.json_dict?.card?.sanitized) {
    return null;
  }

  return mapCommanderPageToVariantPayload(page);
}

async function fetchCardVariant(
  slug: string,
  filters: EdhrecPageFilters,
): Promise<CardVariantPayload | null> {
  const page = await fetchJson<EdhrecCardPage>(
    buildEdhrecPageUrl(EdhrecPageEntityType.CARD, slug, filters),
  );

  if (!page?.container?.json_dict?.card?.sanitized) {
    return null;
  }

  return mapCardPageToVariantPayload(page);
}

async function getCachedCommanderVariant(
  slug: string,
  filters: EdhrecPageFilters,
): Promise<EdhrecCacheResult<CommanderVariantPayload>> {
  const normalized = normalizePageFilters(filters);
  const syncedAt = new Date();
  const expiresAt = getTierExpiry(VARIANT_TTL_TIER, syncedAt);

  const cached = await prisma.edhrecPageVariant.findUnique({
    where: {
      entityType_slug_theme_budget_bracket: {
        entityType: EdhrecPageEntityType.COMMANDER,
        slug,
        theme: normalized.theme,
        budget: normalized.budget,
        bracket: normalized.bracket,
      },
    },
  });

  if (cached && isFresh(cached.expiresAt)) {
    return toCacheResult(
      cached.payload as CommanderVariantPayload,
      false,
      cached.syncedAt,
      VARIANT_TTL_TIER,
      true,
    );
  }

  try {
    const fetched = await fetchCommanderVariant(slug, filters);

    if (!fetched) {
      return toCacheResult(
        (cached?.payload as CommanderVariantPayload | undefined) ?? null,
        cached != null,
        cached?.syncedAt ?? null,
        cached ? VARIANT_TTL_TIER : null,
        true,
      );
    }

    const row = await prisma.edhrecPageVariant.upsert({
      where: {
        entityType_slug_theme_budget_bracket: {
          entityType: EdhrecPageEntityType.COMMANDER,
          slug,
          theme: normalized.theme,
          budget: normalized.budget,
          bracket: normalized.bracket,
        },
      },
      create: {
        entityType: EdhrecPageEntityType.COMMANDER,
        slug,
        theme: normalized.theme,
        budget: normalized.budget,
        bracket: normalized.bracket,
        payload: fetched as Prisma.InputJsonValue,
        syncedAt,
        expiresAt,
      },
      update: {
        payload: fetched as Prisma.InputJsonValue,
        syncedAt,
        expiresAt,
      },
    });

    return toCacheResult(fetched, false, row.syncedAt, VARIANT_TTL_TIER, true);
  } catch {
    return toCacheResult(
      (cached?.payload as CommanderVariantPayload | undefined) ?? null,
      cached != null,
      cached?.syncedAt ?? null,
      cached ? VARIANT_TTL_TIER : null,
      true,
    );
  }
}

async function getCachedCardVariant(
  slug: string,
  filters: EdhrecPageFilters,
): Promise<EdhrecCacheResult<CardVariantPayload>> {
  const normalized = normalizePageFilters(filters);
  const syncedAt = new Date();
  const expiresAt = getTierExpiry(VARIANT_TTL_TIER, syncedAt);

  const cached = await prisma.edhrecPageVariant.findUnique({
    where: {
      entityType_slug_theme_budget_bracket: {
        entityType: EdhrecPageEntityType.CARD,
        slug,
        theme: normalized.theme,
        budget: normalized.budget,
        bracket: normalized.bracket,
      },
    },
  });

  if (cached && isFresh(cached.expiresAt)) {
    return toCacheResult(
      cached.payload as CardVariantPayload,
      false,
      cached.syncedAt,
      VARIANT_TTL_TIER,
      true,
    );
  }

  try {
    const fetched = await fetchCardVariant(slug, filters);

    if (!fetched) {
      return toCacheResult(
        (cached?.payload as CardVariantPayload | undefined) ?? null,
        cached != null,
        cached?.syncedAt ?? null,
        cached ? VARIANT_TTL_TIER : null,
        true,
      );
    }

    const row = await prisma.edhrecPageVariant.upsert({
      where: {
        entityType_slug_theme_budget_bracket: {
          entityType: EdhrecPageEntityType.CARD,
          slug,
          theme: normalized.theme,
          budget: normalized.budget,
          bracket: normalized.bracket,
        },
      },
      create: {
        entityType: EdhrecPageEntityType.CARD,
        slug,
        theme: normalized.theme,
        budget: normalized.budget,
        bracket: normalized.bracket,
        payload: fetched as Prisma.InputJsonValue,
        syncedAt,
        expiresAt,
      },
      update: {
        payload: fetched as Prisma.InputJsonValue,
        syncedAt,
        expiresAt,
      },
    });

    return toCacheResult(fetched, false, row.syncedAt, VARIANT_TTL_TIER, true);
  } catch {
    return toCacheResult(
      (cached?.payload as CardVariantPayload | undefined) ?? null,
      cached != null,
      cached?.syncedAt ?? null,
      cached ? VARIANT_TTL_TIER : null,
      true,
    );
  }
}

export async function getCommanderDetailData(
  slug: string,
  options: EdhrecCacheOptions = {},
): Promise<EdhrecCacheResult<CommanderDetailData>> {
  const filters = options.filters ?? {};
  const unsupportedMessage = getUnsupportedCommanderFilterMessage(filters);

  if (unsupportedMessage) {
    return toCacheResult<CommanderDetailData>(null, false, null, null, true);
  }

  const base = await prisma.edhrecCommanderProfile.findUnique({ where: { slug } });

  if (!hasActivePageFilters(filters)) {
    if (base && isFresh(base.expiresAt)) {
      return toCacheResult(
        {
          slug: base.slug,
          name: base.name,
          rank: base.rank,
          salt: base.salt,
          numDecks: base.numDecks,
          colorIdentity: base.colorIdentity,
          tagCounts: (base.tagCounts as Record<string, number>) ?? {},
          similarSlugs: base.similarSlugs,
          cardlists: base.cardlists as CardlistsInput,
        },
        false,
        base.syncedAt,
        base.syncTier,
        false,
      );
    }

    const { getCachedCommanderProfile } = await import("@/lib/edhrec/cache");
    const refreshed = await getCachedCommanderProfile(slug, { warm: options.warm });

    if (!refreshed.data) {
      return toCacheResult<CommanderDetailData>(null, refreshed.isStale, refreshed.syncedAt, refreshed.syncTier, false);
    }

    return toCacheResult(
      {
        slug: refreshed.data.slug,
        name: refreshed.data.name,
        rank: refreshed.data.rank,
        salt: refreshed.data.salt,
        numDecks: refreshed.data.numDecks,
        colorIdentity: refreshed.data.colorIdentity,
        tagCounts: (refreshed.data.tagCounts as Record<string, number>) ?? {},
        similarSlugs: refreshed.data.similarSlugs,
        cardlists: refreshed.data.cardlists as CardlistsInput,
      },
      refreshed.isStale,
      refreshed.syncedAt,
      refreshed.syncTier,
      false,
    );
  }

  const variant = await getCachedCommanderVariant(slug, filters);

  if (!variant.data) {
    return toCacheResult<CommanderDetailData>(null, variant.isStale, variant.syncedAt, variant.syncTier, true);
  }

  return toCacheResult(
    {
      slug,
      name: variant.data.name,
      rank: variant.data.rank,
      salt: variant.data.salt,
      numDecks: variant.data.numDecks,
      colorIdentity: base?.colorIdentity ?? [],
      tagCounts: variant.data.tagCounts,
      similarSlugs: variant.data.similarSlugs,
      cardlists: variant.data.cardlists as CardlistsInput,
    },
    variant.isStale,
    variant.syncedAt,
    variant.syncTier,
    true,
  );
}

export async function getCardDetailEdhrecData(
  slug: string,
  options: EdhrecCacheOptions = {},
): Promise<EdhrecCacheResult<CardDetailEdhrecData>> {
  const filters = options.filters ?? {};

  if (!hasActivePageFilters(filters)) {
    const { getCachedCardData } = await import("@/lib/edhrec/cache");
    const refreshed = await getCachedCardData(slug, { warm: options.warm });

    if (!refreshed.data) {
      return toCacheResult<CardDetailEdhrecData>(null, refreshed.isStale, refreshed.syncedAt, refreshed.syncTier, false);
    }

    const potentialDecks =
      refreshed.data.potentialDecks != null && refreshed.data.potentialDecks > 0
        ? refreshed.data.potentialDecks
        : null;

    return toCacheResult(
      {
        slug: refreshed.data.slug,
        name: refreshed.data.name,
        salt: refreshed.data.salt,
        numDecks: refreshed.data.numDecks,
        inclusion: refreshed.data.inclusion,
        potentialDecks,
        cardlists: refreshed.data.cardlists as CardlistsInput,
        similarCards: (refreshed.data.similarCards as string[]) ?? [],
      },
      refreshed.isStale,
      refreshed.syncedAt,
      refreshed.syncTier,
      false,
    );
  }

  const variant = await getCachedCardVariant(slug, filters);

  if (!variant.data) {
    return toCacheResult<CardDetailEdhrecData>(null, variant.isStale, variant.syncedAt, variant.syncTier, true);
  }

  return toCacheResult(
    {
      slug,
      name: variant.data.name,
      salt: variant.data.salt,
      numDecks: variant.data.numDecks,
      inclusion: variant.data.inclusion,
      potentialDecks: variant.data.potentialDecks,
      cardlists: variant.data.cardlists as CardlistsInput,
      similarCards: variant.data.similarCards,
    },
    variant.isStale,
    variant.syncedAt,
    variant.syncTier,
    true,
  );
}
