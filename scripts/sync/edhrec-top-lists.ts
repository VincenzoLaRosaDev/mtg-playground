import { config } from "dotenv";

import {
  EdhrecTopEntityType,
  SyncSource,
  SyncStatus,
} from "../../src/generated/prisma/client";
import type { PrismaClient } from "../../src/generated/prisma/client";
import {
  fetchCardTopEntries,
  fetchCommanderTopEntries,
  type ParsedTopEntry,
} from "../../src/lib/edhrec/top-index";
import { topWindowParamToEnum } from "../../src/lib/edhrec/top-window-db";
import {
  EDHREC_TOP_WINDOW_VALUES,
  type EdhrecTopWindowParam,
} from "../../src/lib/edhrec/top-window";

/** JSON top lists exist for week/month/year only; `all` uses profile/HOT browse fallback. */
const SYNCABLE_TOP_WINDOWS = EDHREC_TOP_WINDOW_VALUES.filter(
  (window): window is Exclude<EdhrecTopWindowParam, "all"> => window !== "all",
);

config({ path: ".env.local" });
config({ path: ".env" });

const REQUEST_DELAY_MS = 500;
/** Chunk size for createMany inside the replace transaction. */
const WRITE_CHUNK_SIZE = 1000;
/**
 * Interactive transaction timeout for one (entityType, window) rewrite.
 * Year card windows can be ~30k rows; keep the lock window below GH Action limits.
 */
const REPLACE_TX_TIMEOUT_MS = 10 * 60 * 1000;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseWindows(): Exclude<EdhrecTopWindowParam, "all">[] {
  const windowsArg = process.argv.find((arg) => arg.startsWith("--windows="));

  if (!windowsArg) {
    return [...SYNCABLE_TOP_WINDOWS];
  }

  const requested = windowsArg
    .split("=")[1]
    .split(",")
    .map((value) => value.trim())
    .filter(
      (value): value is Exclude<EdhrecTopWindowParam, "all"> =>
        SYNCABLE_TOP_WINDOWS.includes(value as Exclude<EdhrecTopWindowParam, "all">),
    );

  return requested.length > 0 ? requested : [...SYNCABLE_TOP_WINDOWS];
}

function parseMaxEntries(): number | undefined {
  const limitArg = process.argv.find((arg) => arg.startsWith("--max-entries="));
  if (!limitArg) {
    return undefined;
  }

  const value = Number(limitArg.split("=")[1]);
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : undefined;
}

/**
 * Atomically replace one (entityType, window) slice.
 * Under Postgres READ COMMITTED, browse readers keep seeing the previous
 * committed rows until this transaction commits — no empty mid-sync window.
 */
async function replaceTopEntries(
  prisma: PrismaClient,
  entityType: EdhrecTopEntityType,
  window: EdhrecTopWindowParam,
  entries: ParsedTopEntry[],
): Promise<number> {
  const windowEnum = topWindowParamToEnum(window);
  const syncedAt = new Date();
  const entityLabel = entityType === EdhrecTopEntityType.CARD ? "cards" : "commanders";

  await prisma.$transaction(
    async (tx) => {
      await tx.edhrecTopEntry.deleteMany({
        where: { entityType, window: windowEnum },
      });

      if (entries.length === 0) {
        return;
      }

      for (let offset = 0; offset < entries.length; offset += WRITE_CHUNK_SIZE) {
        const chunk = entries.slice(offset, offset + WRITE_CHUNK_SIZE);

        await tx.edhrecTopEntry.createMany({
          data: chunk.map((entry) => ({
            entityType,
            window: windowEnum,
            rank: entry.rank,
            slug: entry.slug,
            name: entry.name,
            numDecks: entry.numDecks,
            inclusion: entry.inclusion,
            potentialDecks: entry.potentialDecks,
            syncedAt,
          })),
        });

        const written = Math.min(offset + WRITE_CHUNK_SIZE, entries.length);
        if (written % 5000 === 0 || written === entries.length) {
          console.log(`    … wrote ${written}/${entries.length} ${entityLabel} rows`);
        }
      }
    },
    { timeout: REPLACE_TX_TIMEOUT_MS },
  );

  return entries.length;
}

async function syncWindow(
  prisma: PrismaClient,
  window: Exclude<EdhrecTopWindowParam, "all">,
  maxEntries?: number,
): Promise<{ cards: number; commanders: number }> {
  console.log(`\nSyncing top lists for window "${window}"...`);

  const fetchOptions = {
    maxEntries,
    onProgress: ({ page, entries, path }: { page: number; entries: number; path: string }) => {
      if (page > 0 && page % 10 === 0) {
        console.log(`    … page ${page + 1} (${entries} entries, ${path})`);
      }
    },
  };

  const cardEntries = await fetchCardTopEntries(window, fetchOptions);
  console.log(`  Cards: ${cardEntries.length} entries from EDHREC JSON.`);

  const cards = await replaceTopEntries(
    prisma,
    EdhrecTopEntityType.CARD,
    window,
    cardEntries,
  );

  await sleep(REQUEST_DELAY_MS);

  const commanderEntries = await fetchCommanderTopEntries(window, fetchOptions);
  console.log(`  Commanders: ${commanderEntries.length} entries from EDHREC JSON.`);

  const commanders = await replaceTopEntries(
    prisma,
    EdhrecTopEntityType.COMMANDER,
    window,
    commanderEntries,
  );

  await sleep(REQUEST_DELAY_MS);

  return { cards, commanders };
}

async function main() {
  const windows = parseWindows();
  const maxEntries = parseMaxEntries();
  const { createScriptPrismaClient } = await import("../../src/lib/db");
  const prisma = createScriptPrismaClient();

  if (maxEntries) {
    console.log(`Limiting each list to ${maxEntries} entries (--max-entries).`);
  } else {
    console.log("Full sync: following EDHREC list.more until end (no entry cap).");
  }

  console.log(`Windows: ${windows.join(", ")} (skipping "all" — no EDHREC top JSON).`);

  const syncLog = await prisma.syncLog.create({
    data: {
      source: SyncSource.EDHREC,
      jobType: "top_lists",
      status: SyncStatus.RUNNING,
    },
  });

  let totalRecords = 0;

  try {
    for (const window of windows) {
      const result = await syncWindow(prisma, window, maxEntries);
      totalRecords += result.cards + result.commanders;
    }

    console.log(`\nDone. ${totalRecords} top-list rows upserted across ${windows.length} window(s).`);

    await prisma.syncLog.update({
      where: { id: syncLog.id },
      data: {
        status: SyncStatus.SUCCESS,
        completedAt: new Date(),
        recordsProcessed: totalRecords,
      },
    });
  } catch (error) {
    await prisma.syncLog.update({
      where: { id: syncLog.id },
      data: {
        status: SyncStatus.FAILED,
        completedAt: new Date(),
        recordsProcessed: totalRecords,
        errors: {
          message: error instanceof Error ? error.message : String(error),
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
