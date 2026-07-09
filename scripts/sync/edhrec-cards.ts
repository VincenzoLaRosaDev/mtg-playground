import { config } from "dotenv";

import {
  SyncSource,
  SyncStatus,
} from "../../src/generated/prisma/client";
import type { PrismaClient } from "../../src/generated/prisma/client";
import {
  extractCardSlugsFromCardlists,
  fetchCardPage,
  fetchTopCardsFromJson,
  fetchTopCardsFromSite,
  rateLimitPause,
} from "../../src/lib/edhrec/client";
import { mapCardData } from "../../src/lib/edhrec/parse";
import type { EdhrecCardList, EdhrecListEntry } from "../../src/lib/edhrec/types";

config({ path: ".env.local" });
config({ path: ".env" });

const DEFAULT_LIMIT = 2000;
const REQUEST_DELAY_MS = 1000;

function parseLimit(): number {
  const limitArg = process.argv.find((arg) => arg.startsWith("--limit="));
  if (!limitArg) {
    return DEFAULT_LIMIT;
  }

  const value = Number(limitArg.split("=")[1]);
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : DEFAULT_LIMIT;
}

function mergeEntries(
  sources: EdhrecListEntry[][],
  maxCount: number,
): EdhrecListEntry[] {
  const merged: EdhrecListEntry[] = [];
  const seen = new Set<string>();

  for (const source of sources) {
    for (const entry of source) {
      if (seen.has(entry.slug)) {
        continue;
      }

      seen.add(entry.slug);
      merged.push(entry);

      if (merged.length >= maxCount) {
        return merged;
      }
    }
  }

  return merged;
}

async function discoverFromCommanderProfiles(
  prisma: PrismaClient,
): Promise<EdhrecListEntry[]> {
  const profiles = await prisma.edhrecCommanderProfile.findMany({
    select: { cardlists: true },
  });

  const entries: EdhrecListEntry[] = [];
  const seen = new Set<string>();

  for (const profile of profiles) {
    const slugs = extractCardSlugsFromCardlists(
      profile.cardlists as Record<string, EdhrecCardList>,
    );

    for (const entry of slugs) {
      if (seen.has(entry.slug)) {
        continue;
      }

      seen.add(entry.slug);
      entries.push(entry);
    }
  }

  return entries;
}

async function discoverCardSlugs(
  prisma: PrismaClient,
  limit: number,
): Promise<EdhrecListEntry[]> {
  console.log("Discovering card slugs...");

  const fromJson = await fetchTopCardsFromJson(limit);
  if (fromJson.length > 0) {
    console.log(`Found ${fromJson.length} cards from EDHREC top JSON API.`);
    return fromJson.slice(0, limit);
  }

  console.log("Top JSON API unavailable; falling back to EDHREC site index scrape.");
  const fromSite = await fetchTopCardsFromSite(limit);
  console.log(`Found ${fromSite.length} cards from EDHREC site index.`);

  const fromCommanders = await discoverFromCommanderProfiles(prisma);
  console.log(`Found ${fromCommanders.length} cards from synced commander profiles.`);

  if (fromSite.length >= limit) {
    return fromSite.slice(0, limit);
  }

  const localCards = await prisma.card.findMany({
    where: { edhrecSlug: { not: null } },
    select: { edhrecSlug: true, name: true },
    orderBy: { name: "asc" },
    take: limit * 2,
  });

  const supplement: EdhrecListEntry[] = localCards
    .filter((card): card is { edhrecSlug: string; name: string } => Boolean(card.edhrecSlug))
    .map((card) => ({
      slug: card.edhrecSlug,
      name: card.name,
      rank: null,
    }));

  const merged = mergeEntries([fromSite, fromCommanders, supplement], limit);
  console.log(`Expanded discovery pool to ${merged.length} cards.`);
  return merged;
}

async function resolveCardId(prisma: PrismaClient, slug: string): Promise<string | null> {
  const card = await prisma.card.findFirst({
    where: { edhrecSlug: slug },
    select: { id: true },
  });

  return card?.id ?? null;
}

async function main() {
  const limit = parseLimit();
  const { createScriptPrismaClient } = await import("../../src/lib/db");
  const prisma = createScriptPrismaClient();

  const syncLog = await prisma.syncLog.create({
    data: {
      source: SyncSource.EDHREC,
      jobType: "cards_hot",
      status: SyncStatus.RUNNING,
    },
  });

  const failures: { slug: string; message: string }[] = [];
  let processed = 0;
  let skipped = 0;

  try {
    const targets = await discoverCardSlugs(prisma, limit);
    console.log(`Syncing ${targets.length} card pages...`);

    for (const [index, target] of targets.entries()) {
      const page = await fetchCardPage(target.slug);

      if (!page?.container?.json_dict?.card?.sanitized) {
        skipped += 1;
        failures.push({
          slug: target.slug,
          message: "Missing card payload",
        });
        process.stdout.write(`\rSkipped ${skipped}, synced ${processed}/${targets.length}...`);
        await rateLimitPause(REQUEST_DELAY_MS);
        continue;
      }

      const data = mapCardData(page);
      const cardId = await resolveCardId(prisma, data.slug);

      await prisma.edhrecCardData.upsert({
        where: { slug: data.slug },
        create: {
          ...data,
          cardId,
        },
        update: {
          ...data,
          cardId,
        },
      });

      processed += 1;
      process.stdout.write(`\rSynced ${processed}/${targets.length} (${data.name})...`);

      if (index < targets.length - 1) {
        await rateLimitPause(REQUEST_DELAY_MS);
      }
    }

    console.log(`\nDone. ${processed} card pages upserted, ${skipped} skipped.`);

    await prisma.syncLog.update({
      where: { id: syncLog.id },
      data: {
        status: SyncStatus.SUCCESS,
        completedAt: new Date(),
        recordsProcessed: processed,
        errors: failures.length > 0 ? { skipped, failures: failures.slice(0, 25) } : undefined,
      },
    });
  } catch (error) {
    await prisma.syncLog.update({
      where: { id: syncLog.id },
      data: {
        status: SyncStatus.FAILED,
        completedAt: new Date(),
        recordsProcessed: processed,
        errors: {
          message: error instanceof Error ? error.message : String(error),
          failures: failures.slice(0, 25),
        },
      },
    });
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
