import { createGunzip } from "node:zlib";
import { createInterface } from "node:readline";
import { Readable } from "node:stream";
import { config } from "dotenv";

import { SyncSource, SyncStatus } from "../../src/generated/prisma/client";
import type { PrismaClient } from "../../src/generated/prisma/client";
import type { ScryfallBulkData, ScryfallCard } from "../../src/lib/scryfall/types";
import {
  getCmc,
  getImageUri,
  isCommanderLegal,
  normalizeSearchName,
  toEdhrecSlug,
} from "../../src/lib/scryfall/card-utils";

// Must run before importing db.ts (that module reads DATABASE_URL at load time)
config({ path: ".env.local" });
config({ path: ".env" });

const BATCH_SIZE = 200;
const BULK_TYPE = "oracle_cards";

async function fetchBulkMetadata(): Promise<ScryfallBulkData> {
  const response = await fetch(
    `https://api.scryfall.com/bulk-data/${BULK_TYPE}`,
    {
      headers: { Accept: "application/json", "User-Agent": "EDHForge/1.0" },
    },
  );

  if (!response.ok) {
    throw new Error(`Scryfall bulk metadata failed: ${response.status}`);
  }

  return response.json() as Promise<ScryfallBulkData>;
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

  return { processed, skipped };
}

async function main() {
  const { createScriptPrismaClient } = await import("../../src/lib/db");
  const prisma = createScriptPrismaClient();

  const syncLog = await prisma.syncLog.create({
    data: {
      source: SyncSource.SCRYFALL,
      jobType: "oracle_cards_full",
      status: SyncStatus.RUNNING,
    },
  });

  try {
    console.log("Fetching Scryfall bulk metadata...");
    const bulk = await fetchBulkMetadata();
    const downloadUrl = bulk.jsonl_download_uri ?? bulk.download_uri;
    console.log(`Downloading ${BULK_TYPE} (updated ${bulk.updated_at})...`);

    const response = await fetch(downloadUrl, {
      headers: { "User-Agent": "EDHForge/1.0" },
    });

    if (!response.ok || !response.body) {
      throw new Error(`Download failed: ${response.status}`);
    }

    const { processed, skipped } = await processBulkStream(prisma, response.body);
    console.log(`\nDone. ${processed} cards upserted, ${skipped} lines skipped.`);

    await prisma.syncLog.update({
      where: { id: syncLog.id },
      data: {
        status: SyncStatus.SUCCESS,
        completedAt: new Date(),
        recordsProcessed: processed,
        errors: skipped > 0 ? { skipped } : undefined,
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
