import { createGunzip } from "node:zlib";
import { createInterface } from "node:readline";
import { Readable } from "node:stream";
import { config } from "dotenv";

import { SyncSource, SyncStatus } from "../../src/generated/prisma/client";
import type { PrismaClient } from "../../src/generated/prisma/client";
import {
  fetchBulkMetadata,
  getBulkDownloadUrl,
  ORACLE_CARDS_BULK_TYPE,
  SCRYFALL_USER_AGENT,
} from "../../src/lib/scryfall/bulk-client";
import type { ScryfallCard } from "../../src/lib/scryfall/types";
import {
  getCmc,
  getImageUri,
  isCommanderLegal,
  normalizeSearchName,
  toEdhrecSlug,
} from "../../src/lib/scryfall/card-utils";
import { shouldIndexScryfallCard } from "../../src/lib/scryfall/catalog-filters";

// Must run before importing db.ts (that module reads DATABASE_URL at load time)
config({ path: ".env.local" });
config({ path: ".env" });

const BATCH_SIZE = 200;
const JOB_TYPE = "oracle_cards_full";

function parseArgs() {
  return {
    ifChanged: process.argv.includes("--if-changed"),
  };
}

async function getLastSuccessfulBulkUpdatedAt(
  prisma: PrismaClient,
): Promise<string | null> {
  const last = await prisma.syncLog.findFirst({
    where: {
      source: SyncSource.SCRYFALL,
      jobType: JOB_TYPE,
      status: SyncStatus.SUCCESS,
    },
    orderBy: { completedAt: "desc" },
    select: { errors: true },
  });

  if (!last?.errors || typeof last.errors !== "object" || Array.isArray(last.errors)) {
    return null;
  }

  const bulkUpdatedAt = (last.errors as Record<string, unknown>).bulkUpdatedAt;
  return typeof bulkUpdatedAt === "string" ? bulkUpdatedAt : null;
}

function mapCard(card: ScryfallCard) {
  return {
    id: card.id,
    oracleId: card.oracle_id,
    name: card.name,
    searchName: normalizeSearchName(card.name),
    edhrecSlug: toEdhrecSlug(card.name),
    typeLine: card.type_line,
    cmc: getCmc(card),
    colors: card.colors ?? [],
    colorIdentity: card.color_identity ?? [],
    oracleText: card.oracle_text ?? null,
    keywords: card.keywords ?? [],
    producedMana: card.produced_mana ?? [],
    layout: card.layout,
    imageUri: getImageUri(card),
    legalities: card.legalities,
    prices: card.prices ?? undefined,
    isCommander: isCommanderLegal(card),
    syncedAt: new Date(),
  };
}

async function upsertBatch(
  prisma: PrismaClient,
  cards: ReturnType<typeof mapCard>[],
) {
  await prisma.$transaction(
    cards.map((card) =>
      prisma.card.upsert({
        where: { id: card.id },
        create: card,
        update: card,
      }),
    ),
    { timeout: 60_000 },
  );
}

async function processBulkStream(
  prisma: PrismaClient,
  body: ReadableStream<Uint8Array>,
) {
  const nodeStream = Readable.fromWeb(body as Parameters<typeof Readable.fromWeb>[0]);
  const gunzip = createGunzip();
  const lines = createInterface({ input: nodeStream.pipe(gunzip), crlfDelay: Infinity });

  let batch: ReturnType<typeof mapCard>[] = [];
  let processed = 0;
  let skipped = 0;
  let excluded = 0;

  for await (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    let card: ScryfallCard;
    try {
      card = JSON.parse(trimmed) as ScryfallCard;
    } catch {
      skipped += 1;
      continue;
    }

    if (!card.id || !card.oracle_id || !card.name) {
      skipped += 1;
      continue;
    }

    if (!shouldIndexScryfallCard(card)) {
      excluded += 1;
      continue;
    }

    batch.push(mapCard(card));

    if (batch.length >= BATCH_SIZE) {
      await upsertBatch(prisma, batch);
      processed += batch.length;
      process.stdout.write(`\rProcessed ${processed} cards...`);
      batch = [];
    }
  }

  if (batch.length > 0) {
    await upsertBatch(prisma, batch);
    processed += batch.length;
  }

  return { processed, skipped, excluded };
}

async function main() {
  const { ifChanged } = parseArgs();
  const { createScriptPrismaClient } = await import("../../src/lib/db");
  const prisma = createScriptPrismaClient();

  console.log("Fetching Scryfall bulk metadata...");
  const bulk = await fetchBulkMetadata(ORACLE_CARDS_BULK_TYPE);

  if (ifChanged) {
    const lastBulkUpdatedAt = await getLastSuccessfulBulkUpdatedAt(prisma);
    if (lastBulkUpdatedAt && lastBulkUpdatedAt === bulk.updated_at) {
      console.log(
        `Bulk unchanged (${bulk.updated_at}). Skipping download (--if-changed).`,
      );
      await prisma.syncLog.create({
        data: {
          source: SyncSource.SCRYFALL,
          jobType: JOB_TYPE,
          status: SyncStatus.SUCCESS,
          completedAt: new Date(),
          recordsProcessed: 0,
          errors: {
            skipped: true,
            reason: "bulk_unchanged",
            bulkUpdatedAt: bulk.updated_at,
          },
        },
      });
      await prisma.$disconnect();
      return;
    }
  }

  const syncLog = await prisma.syncLog.create({
    data: {
      source: SyncSource.SCRYFALL,
      jobType: JOB_TYPE,
      status: SyncStatus.RUNNING,
    },
  });

  try {
    const downloadUrl = getBulkDownloadUrl(bulk);
    console.log(`Downloading ${ORACLE_CARDS_BULK_TYPE} (updated ${bulk.updated_at})...`);

    const response = await fetch(downloadUrl, {
      headers: { "User-Agent": SCRYFALL_USER_AGENT },
    });

    if (!response.ok || !response.body) {
      throw new Error(`Download failed: ${response.status}`);
    }

    const { processed, skipped, excluded } = await processBulkStream(prisma, response.body);
    const purged = await prisma.card.deleteMany({
      where: { layout: "art_series" },
    });
    console.log(
      `\nDone. ${processed} cards upserted, ${skipped} lines skipped, ${excluded} excluded layouts, ${purged.count} art_series purged.`,
    );

    await prisma.syncLog.update({
      where: { id: syncLog.id },
      data: {
        status: SyncStatus.SUCCESS,
        completedAt: new Date(),
        recordsProcessed: processed,
        errors: {
          bulkUpdatedAt: bulk.updated_at,
          ...(skipped > 0 || excluded > 0 || purged.count > 0
            ? { skipped, excluded, purged: purged.count }
            : {}),
        },
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
