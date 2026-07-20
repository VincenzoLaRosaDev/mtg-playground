import { config } from "dotenv";

import { SyncSource, SyncStatus } from "../../src/generated/prisma/client";
import type { PrismaClient } from "../../src/generated/prisma/client";
import type { ScryfallSet, ScryfallSetList } from "../../src/lib/scryfall/types";

config({ path: ".env.local" });
config({ path: ".env" });

const USER_AGENT = "MTGPlayground/1.0";
const SKIP_SET_TYPES = new Set(["token", "memorabilia"]);

function mapSet(set: ScryfallSet) {
  return {
    code: set.code,
    scryfallId: set.id,
    name: set.name,
    releasedAt: set.released_at ? new Date(set.released_at) : null,
    setType: set.set_type,
    cardCount: set.card_count,
    iconUri: set.icon_svg_uri,
    digital: set.digital,
    syncedAt: new Date(),
  };
}

async function fetchAllSets(): Promise<ScryfallSet[]> {
  const sets: ScryfallSet[] = [];
  let nextUrl: string | null = "https://api.scryfall.com/sets";

  while (nextUrl) {
    const response = await fetch(nextUrl, {
      headers: { Accept: "application/json", "User-Agent": USER_AGENT },
    });

    if (!response.ok) {
      throw new Error(`Scryfall sets API failed: ${response.status}`);
    }

    const page = (await response.json()) as ScryfallSetList;
    sets.push(...page.data);
    nextUrl = page.has_more ? (page.next_page ?? null) : null;
  }

  return sets;
}

async function main() {
  const { createScriptPrismaClient } = await import("../../src/lib/db");
  const prisma = createScriptPrismaClient();

  const syncLog = await prisma.syncLog.create({
    data: {
      source: SyncSource.SCRYFALL,
      jobType: "sets",
      status: SyncStatus.RUNNING,
    },
  });

  try {
    console.log("Fetching Scryfall sets...");
    const sets = await fetchAllSets();
    const eligible = sets.filter((set) => !SKIP_SET_TYPES.has(set.set_type));
    console.log(`Upserting ${eligible.length} sets (${sets.length - eligible.length} skipped by type)...`);

    let processed = 0;
    for (const set of eligible) {
      await prisma.mtgSet.upsert({
        where: { code: set.code },
        create: mapSet(set),
        update: mapSet(set),
        select: { code: true },
      });
      processed += 1;
      process.stdout.write(`\rSynced ${processed}/${eligible.length} sets...`);
    }

    console.log(`\nDone. ${processed} sets upserted.`);

    await prisma.syncLog.update({
      where: { id: syncLog.id },
      data: {
        status: SyncStatus.SUCCESS,
        completedAt: new Date(),
        recordsProcessed: processed,
      },
    });
  } catch (error) {
    await prisma.syncLog.update({
      where: { id: syncLog.id },
      data: {
        status: SyncStatus.FAILED,
        completedAt: new Date(),
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
