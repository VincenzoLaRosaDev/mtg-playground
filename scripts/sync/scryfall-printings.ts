import { createGunzip } from "node:zlib";
import { createInterface } from "node:readline";
import { Readable } from "node:stream";
import { config } from "dotenv";

import { Prisma, SyncSource, SyncStatus } from "../../src/generated/prisma/client";
import type { PrismaClient } from "../../src/generated/prisma/client";
import {
  DEFAULT_CARDS_BULK_TYPE,
  fetchBulkMetadata,
  getBulkDownloadUrl,
  SCRYFALL_USER_AGENT,
} from "../../src/lib/scryfall/bulk-client";
import { getImageUri } from "../../src/lib/scryfall/card-utils";
import { mapScryfallFaces } from "../../src/lib/scryfall/faces";
import type { ScryfallCard } from "../../src/lib/scryfall/types";

config({ path: ".env.local" });
config({ path: ".env" });

const BATCH_SIZE = 200;
const JOB_TYPE = "printings";

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

type MappedPrinting = {
  id: string;
  oracleId: string;
  setCode: string;
  collectorNumber: string;
  name: string;
  rarity: string;
  layout: string;
  lang: string;
  digital: boolean;
  finishes: string[];
  imageUri: string | null;
  faces: Prisma.InputJsonValue | typeof Prisma.JsonNull;
  prices: Prisma.InputJsonValue | typeof Prisma.JsonNull;
  illustrationId: string | null;
  releasedAt: Date | null;
  syncedAt: Date;
};

function mapPrinting(card: ScryfallCard): MappedPrinting | null {
  if (!card.id || !card.oracle_id || !card.name || !card.set || !card.collector_number) {
    return null;
  }

  if (card.layout === "art_series") {
    return null;
  }

  const releasedAt =
    card.released_at && !Number.isNaN(Date.parse(card.released_at))
      ? new Date(card.released_at)
      : null;

  return {
    id: card.id,
    oracleId: card.oracle_id,
    setCode: card.set.toLowerCase(),
    collectorNumber: card.collector_number,
    name: card.name,
    rarity: (card.rarity ?? "unknown").toLowerCase(),
    layout: card.layout,
    lang: card.lang ?? "en",
    digital: Boolean(card.digital),
    finishes: card.finishes ?? [],
    imageUri: getImageUri(card),
    faces: mapScryfallFaces(card) ?? Prisma.JsonNull,
    prices: (card.prices as Prisma.InputJsonValue | undefined) ?? Prisma.JsonNull,
    illustrationId: card.illustration_id ?? null,
    releasedAt,
    syncedAt: new Date(),
  };
}

async function upsertBatch(prisma: PrismaClient, rows: MappedPrinting[]) {
  // Dedupe by Scryfall id within the batch (last wins).
  const byId = new Map(rows.map((row) => [row.id, row]));
  const unique = [...byId.values()];

  await prisma.$transaction(
    async (tx) => {
      for (const row of unique) {
        const { id, ...updateFields } = row;
        await tx.printing.upsert({
          where: { id },
          create: row,
          update: updateFields,
          select: { id: true },
        });
      }
    },
    { timeout: 120_000 },
  );
}

async function processBulkStream(
  prisma: PrismaClient,
  body: ReadableStream<Uint8Array>,
  knownSetCodes: Set<string>,
) {
  const nodeStream = Readable.fromWeb(body as Parameters<typeof Readable.fromWeb>[0]);
  const gunzip = createGunzip();
  const lines = createInterface({ input: nodeStream.pipe(gunzip), crlfDelay: Infinity });

  let batch: MappedPrinting[] = [];
  let processed = 0;
  let skipped = 0;
  let unknownSet = 0;
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

    const mapped = mapPrinting(card);
    if (!mapped) {
      if (card.layout === "art_series") {
        excluded += 1;
      } else {
        skipped += 1;
      }
      continue;
    }

    if (!knownSetCodes.has(mapped.setCode)) {
      unknownSet += 1;
      continue;
    }

    batch.push(mapped);

    if (batch.length >= BATCH_SIZE) {
      await upsertBatch(prisma, batch);
      processed += batch.length;
      process.stdout.write(`\rProcessed ${processed} printings...`);
      batch = [];
    }
  }

  if (batch.length > 0) {
    await upsertBatch(prisma, batch);
    processed += batch.length;
  }

  return { processed, skipped, unknownSet, excluded };
}

async function main() {
  const { ifChanged } = parseArgs();
  const { createScriptPrismaClient } = await import("../../src/lib/db");
  const prisma = createScriptPrismaClient();

  const setRows = await prisma.mtgSet.findMany({ select: { code: true } });
  const knownSetCodes = new Set(setRows.map((row) => row.code));
  if (knownSetCodes.size === 0) {
    throw new Error("No mtg_sets rows — run npm run sync:scryfall-sets first.");
  }

  console.log("Fetching Scryfall default_cards bulk metadata...");
  const bulk = await fetchBulkMetadata(DEFAULT_CARDS_BULK_TYPE);

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
    console.log(`Downloading ${DEFAULT_CARDS_BULK_TYPE} (updated ${bulk.updated_at})...`);

    const response = await fetch(downloadUrl, {
      headers: { "User-Agent": SCRYFALL_USER_AGENT },
    });

    if (!response.ok || !response.body) {
      throw new Error(`Download failed: ${response.status}`);
    }

    const { processed, skipped, unknownSet, excluded } = await processBulkStream(
      prisma,
      response.body,
      knownSetCodes,
    );

    console.log(
      `\nDone. ${processed} printings upserted, ${skipped} skipped, ${unknownSet} unknown set, ${excluded} art_series excluded.`,
    );

    await prisma.syncLog.update({
      where: { id: syncLog.id },
      data: {
        status: SyncStatus.SUCCESS,
        completedAt: new Date(),
        recordsProcessed: processed,
        errors: {
          bulkUpdatedAt: bulk.updated_at,
          skipped,
          unknownSet,
          excluded,
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
