import { config } from "dotenv";

import {
  SyncSource,
  SyncStatus,
} from "../../src/generated/prisma/client";
import type { PrismaClient } from "../../src/generated/prisma/client";
import {
  fetchCommanderPage,
  fetchTopCommandersFromJson,
  fetchTopCommandersFromSite,
  rateLimitPause,
} from "../../src/lib/edhrec/client";
import { mapCommanderProfile } from "../../src/lib/edhrec/parse";
import type { CommanderListEntry } from "../../src/lib/edhrec/types";
import { resolvePlayableCardId } from "../../src/lib/scryfall/catalog-filters";

config({ path: ".env.local" });
config({ path: ".env" });

const DEFAULT_LIMIT = 500;
const REQUEST_DELAY_MS = 1000;

type SyncState = {
  processed: number;
  skipped: number;
  failures: { slug: string; message: string }[];
  attemptedSlugs: Set<string>;
};

function parseLimit(): number {
  const limitArg = process.argv.find((arg) => arg.startsWith("--limit="));
  if (!limitArg) {
    return DEFAULT_LIMIT;
  }

  const value = Number(limitArg.split("=")[1]);
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : DEFAULT_LIMIT;
}

async function discoverSeedCommanders(limit: number): Promise<CommanderListEntry[]> {
  console.log("Discovering commander seed list...");

  const fromJson = await fetchTopCommandersFromJson(limit);
  if (fromJson.length > 0) {
    console.log(`Found ${fromJson.length} commanders from EDHREC top JSON API.`);
    return fromJson.slice(0, limit);
  }

  console.log("Top JSON API unavailable; falling back to EDHREC site index scrape.");
  const fromSite = await fetchTopCommandersFromSite(limit);
  console.log(`Found ${fromSite.length} commanders from EDHREC site index.`);
  return fromSite;
}

async function discoverExpansionSlugs(
  prisma: PrismaClient,
  exclude: Set<string>,
  maxCount: number,
): Promise<CommanderListEntry[]> {
  const profiles = await prisma.edhrecCommanderProfile.findMany({
    select: { similarSlugs: true },
    where: { rank: { not: null } },
    orderBy: { rank: "asc" },
  });

  const entries: CommanderListEntry[] = [];
  const seen = new Set(exclude);

  for (const profile of profiles) {
    for (const slug of profile.similarSlugs) {
      if (!slug || seen.has(slug)) {
        continue;
      }

      seen.add(slug);
      entries.push({ slug, name: slug, rank: null });

      if (entries.length >= maxCount) {
        return entries;
      }
    }
  }

  return entries;
}

async function resolveCardId(prisma: PrismaClient, slug: string): Promise<string | null> {
  return resolvePlayableCardId(prisma, slug);
}

async function syncCommanderBatch(
  prisma: PrismaClient,
  targets: CommanderListEntry[],
  state: SyncState,
): Promise<void> {
  for (const [index, target] of targets.entries()) {
    if (state.attemptedSlugs.has(target.slug)) {
      continue;
    }

    state.attemptedSlugs.add(target.slug);

    const page = await fetchCommanderPage(target.slug);

    if (!page?.container?.json_dict?.card?.sanitized) {
      state.skipped += 1;
      state.failures.push({
        slug: target.slug,
        message: "Missing commander payload",
      });
      process.stdout.write(
        `\rSkipped ${state.skipped}, synced ${state.processed}/${state.attemptedSlugs.size}...`,
      );
      await rateLimitPause(REQUEST_DELAY_MS);
      continue;
    }

    const profile = mapCommanderProfile(page);
    const cardId = await resolveCardId(prisma, profile.slug);

    await prisma.edhrecCommanderProfile.upsert({
      where: { slug: profile.slug },
      create: {
        ...profile,
        cardId,
      },
      update: {
        ...profile,
        cardId,
      },
    });

    state.processed += 1;
    process.stdout.write(
      `\rSynced ${state.processed}, skipped ${state.skipped} (${profile.name})...`,
    );

    if (index < targets.length - 1) {
      await rateLimitPause(REQUEST_DELAY_MS);
    }
  }
}

async function main() {
  const limit = parseLimit();
  const { createScriptPrismaClient } = await import("../../src/lib/db");
  const prisma = createScriptPrismaClient();

  const syncLog = await prisma.syncLog.create({
    data: {
      source: SyncSource.EDHREC,
      jobType: "commanders_hot",
      status: SyncStatus.RUNNING,
    },
  });

  const state: SyncState = {
    processed: 0,
    skipped: 0,
    failures: [],
    attemptedSlugs: new Set(),
  };

  try {
    const seed = await discoverSeedCommanders(limit);
    const useTwoPhase = seed.length < limit;

    if (useTwoPhase) {
      console.log(
        `Two-phase sync: ${seed.length} seed commanders, then similar expansion to ${limit}.`,
      );
      await syncCommanderBatch(prisma, seed, state);

      const expansion = await discoverExpansionSlugs(
        prisma,
        state.attemptedSlugs,
        limit - seed.length,
      );
      console.log(`\nExpanded with ${expansion.length} similar commander slugs from ranked profiles.`);

      if (expansion.length > 0) {
        await syncCommanderBatch(prisma, expansion, state);
      }
    } else {
      console.log(`Syncing ${seed.length} commander profiles...`);
      await syncCommanderBatch(prisma, seed, state);
    }

    console.log(
      `\nDone. ${state.processed} commander profiles upserted, ${state.skipped} skipped.`,
    );

    await prisma.syncLog.update({
      where: { id: syncLog.id },
      data: {
        status: SyncStatus.SUCCESS,
        completedAt: new Date(),
        recordsProcessed: state.processed,
        errors:
          state.failures.length > 0
            ? { skipped: state.skipped, failures: state.failures.slice(0, 25) }
            : undefined,
      },
    });
  } catch (error) {
    await prisma.syncLog.update({
      where: { id: syncLog.id },
      data: {
        status: SyncStatus.FAILED,
        completedAt: new Date(),
        recordsProcessed: state.processed,
        errors: {
          message: error instanceof Error ? error.message : String(error),
          failures: state.failures.slice(0, 25),
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
