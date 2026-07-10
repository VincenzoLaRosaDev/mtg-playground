import type { EdhrecCardData, EdhrecCommanderProfile } from "@/generated/prisma/client";
import { EdhrecSyncTier } from "@/generated/prisma/client";

import { prisma } from "@/lib/db";
import { fetchCardPage, fetchCommanderPage } from "@/lib/edhrec/client";
import { mapCardData, mapCommanderProfile } from "@/lib/edhrec/parse";
import { resolvePlayableCardId } from "@/lib/scryfall/catalog-filters";

export type EdhrecCacheOptions = {
  /** Page view — refresh as WARM tier (7d TTL) when fetching on demand */
  warm?: boolean;
};

export type EdhrecCacheResult<T> = {
  data: T | null;
  isStale: boolean;
  syncedAt: Date | null;
  syncTier: EdhrecSyncTier | null;
};

function isFresh(expiresAt: Date | null): boolean {
  return expiresAt !== null && expiresAt > new Date();
}

function resolveOnDemandTier(options: EdhrecCacheOptions): EdhrecSyncTier {
  return options.warm ? EdhrecSyncTier.WARM : EdhrecSyncTier.COLD;
}

async function resolveCardId(slug: string): Promise<string | null> {
  return resolvePlayableCardId(prisma, slug);
}

function toCacheResult<T extends { syncedAt: Date; syncTier: EdhrecSyncTier }>(
  data: T | null,
  isStale: boolean,
): EdhrecCacheResult<T> {
  return {
    data,
    isStale,
    syncedAt: data?.syncedAt ?? null,
    syncTier: data?.syncTier ?? null,
  };
}

async function refreshCardData(
  slug: string,
  tier: EdhrecSyncTier,
): Promise<EdhrecCardData | null> {
  const page = await fetchCardPage(slug);
  if (!page?.container?.json_dict?.card?.sanitized) {
    return null;
  }

  const mapped = mapCardData(page, tier);
  const cardId = await resolveCardId(mapped.slug);

  return prisma.edhrecCardData.upsert({
    where: { slug: mapped.slug },
    create: { ...mapped, cardId },
    update: { ...mapped, cardId },
  });
}

async function refreshCommanderProfile(
  slug: string,
  tier: EdhrecSyncTier,
): Promise<EdhrecCommanderProfile | null> {
  const page = await fetchCommanderPage(slug);
  if (!page?.container?.json_dict?.card?.sanitized) {
    return null;
  }

  const mapped = mapCommanderProfile(page, tier);
  const cardId = await resolveCardId(mapped.slug);

  return prisma.edhrecCommanderProfile.upsert({
    where: { slug: mapped.slug },
    create: { ...mapped, cardId },
    update: { ...mapped, cardId },
  });
}

export async function getCachedCardData(
  slug: string,
  options: EdhrecCacheOptions = {},
): Promise<EdhrecCacheResult<EdhrecCardData>> {
  const cached = await prisma.edhrecCardData.findUnique({ where: { slug } });

  if (cached && isFresh(cached.expiresAt)) {
    return toCacheResult(cached, false);
  }

  const tier = resolveOnDemandTier(options);

  try {
    const refreshed = await refreshCardData(slug, tier);
    if (refreshed) {
      return toCacheResult(refreshed, false);
    }

    return toCacheResult(cached, cached !== null);
  } catch {
    return toCacheResult(cached, cached !== null);
  }
}

export async function getCachedCommanderProfile(
  slug: string,
  options: EdhrecCacheOptions = {},
): Promise<EdhrecCacheResult<EdhrecCommanderProfile>> {
  const cached = await prisma.edhrecCommanderProfile.findUnique({ where: { slug } });

  if (cached && isFresh(cached.expiresAt)) {
    return toCacheResult(cached, false);
  }

  const tier = resolveOnDemandTier(options);

  try {
    const refreshed = await refreshCommanderProfile(slug, tier);
    if (refreshed) {
      return toCacheResult(refreshed, false);
    }

    return toCacheResult(cached, cached !== null);
  } catch {
    return toCacheResult(cached, cached !== null);
  }
}
