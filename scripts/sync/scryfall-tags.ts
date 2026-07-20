import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { config } from "dotenv";

import { SyncSource, SyncStatus } from "../../src/generated/prisma/client";
import type { OracleTagWeight, PrismaClient } from "../../src/generated/prisma/client";
import { isAcceptedTagWeight } from "../../src/lib/classification/tag-mapping";
import {
  fetchBulkMetadata,
  ORACLE_TAGS_BULK_TYPE,
  SCRYFALL_USER_AGENT,
} from "../../src/lib/scryfall/bulk-client";
import type { ScryfallOracleTag } from "../../src/lib/scryfall/types";

config({ path: ".env.local" });
config({ path: ".env" });

const JOB_TYPE = "oracle_tags_full";
const TAG_BATCH_SIZE = 100;
const TAGGING_BATCH_SIZE = 500;

function parseArgs() {
  return { ifChanged: process.argv.includes("--if-changed") };
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

function toOracleTagWeight(weight: string): OracleTagWeight | null {
  if (weight === "very_strong") return "very_strong";
  if (weight === "strong") return "strong";
  if (weight === "median") return "median";
  if (weight === "weak") return "weak";
  return null;
}

async function loadCatalogOracleIds(prisma: PrismaClient): Promise<Set<string>> {
  const rows = await prisma.card.findMany({ select: { oracleId: true } });
  return new Set(rows.map((row) => row.oracleId));
}

function sanitizeText(value: string): string {
  return value.replaceAll("\u0000", "");
}

async function upsertTags(prisma: PrismaClient, tags: ScryfallOracleTag[]) {
  for (let i = 0; i < tags.length; i += TAG_BATCH_SIZE) {
    const batch = tags.slice(i, i + TAG_BATCH_SIZE);
    await prisma.$transaction(
      batch.map((tag) =>
        prisma.scryfallOracleTag.upsert({
          where: { id: tag.id },
          create: {
            id: tag.id,
            slug: sanitizeText(tag.slug),
            label: sanitizeText(tag.label),
            parentIds: tag.parent_ids ?? [],
          },
          update: {
            slug: sanitizeText(tag.slug),
            label: sanitizeText(tag.label),
            parentIds: tag.parent_ids ?? [],
            syncedAt: new Date(),
          },
          select: { id: true },
        }),
      ),
    );
    if (i > 0 && i % 1000 === 0) {
      process.stdout.write(`\rUpserted ${Math.min(i + TAG_BATCH_SIZE, tags.length)}/${tags.length} tags...`);
    }
  }
  process.stdout.write("\n");
}

type TaggingRow = {
  oracleId: string;
  tagId: string;
  weight: OracleTagWeight;
};

async function insertTaggings(prisma: PrismaClient, rows: TaggingRow[]) {
  for (let i = 0; i < rows.length; i += TAGGING_BATCH_SIZE) {
    const batch = rows.slice(i, i + TAGGING_BATCH_SIZE);
    await prisma.cardOracleTagging.createMany({
      data: batch,
      skipDuplicates: true,
    });
  }
}

async function main() {
  const { ifChanged } = parseArgs();
  const { createScriptPrismaClient } = await import("../../src/lib/db");
  const prisma = createScriptPrismaClient();

  console.log("Fetching Scryfall oracle_tags metadata...");
  const bulk = await fetchBulkMetadata(ORACLE_TAGS_BULK_TYPE);

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
    const downloadUrl = bulk.download_uri;
    console.log(`Downloading ${ORACLE_TAGS_BULK_TYPE} (updated ${bulk.updated_at})...`);

    const response = await fetch(downloadUrl, {
      headers: { "User-Agent": SCRYFALL_USER_AGENT },
    });

    if (!response.ok) {
      throw new Error(`Download failed: ${response.status}`);
    }

    const body = Buffer.from(await response.arrayBuffer());
    const rawText =
      body[0] === 0x1f && body[1] === 0x8b
        ? gunzipSync(body).toString("utf8")
        : body.toString("utf8");
    console.log(`Downloaded ${(rawText.length / 1_000_000).toFixed(1)} MB.`);

    let tags: ScryfallOracleTag[];
    try {
      tags = JSON.parse(rawText) as ScryfallOracleTag[];
    } catch (parseError) {
      throw new Error(
        `JSON parse failed (${rawText.length} bytes): ${parseError instanceof Error ? parseError.message : String(parseError)}`,
      );
    }
    const oracleTags = tags.filter((tag) => tag.type === "oracle");
    console.log(`Loaded ${oracleTags.length} oracle tags.`);

    console.log("Loading catalog oracle_ids...");
    const catalogOracleIds = await loadCatalogOracleIds(prisma);

    console.log("Upserting tag metadata...");
    await upsertTags(prisma, oracleTags);

    console.log("Replacing taggings for catalog cards...");
    await prisma.cardOracleTagging.deleteMany();

    const taggingRows: TaggingRow[] = [];
    let skippedWeak = 0;
    let skippedUnknownWeight = 0;
    let skippedNotInCatalog = 0;

    for (const tag of oracleTags) {
      for (const tagging of tag.taggings ?? []) {
        if (!tagging.oracle_id) continue;

        if (!isAcceptedTagWeight(tagging.weight)) {
          skippedWeak += 1;
          continue;
        }

        const weight = toOracleTagWeight(tagging.weight);
        if (!weight) {
          skippedUnknownWeight += 1;
          continue;
        }

        if (!catalogOracleIds.has(tagging.oracle_id)) {
          skippedNotInCatalog += 1;
          continue;
        }

        taggingRows.push({
          oracleId: tagging.oracle_id,
          tagId: tag.id,
          weight,
        });
      }
    }

    await insertTaggings(prisma, taggingRows);

    console.log(
      `Done. ${taggingRows.length} taggings stored, ${skippedWeak} weak skipped, ${skippedNotInCatalog} not in catalog, ${skippedUnknownWeight} unknown weight.`,
    );

    await prisma.syncLog.update({
      where: { id: syncLog.id },
      data: {
        status: SyncStatus.SUCCESS,
        completedAt: new Date(),
        recordsProcessed: taggingRows.length,
        errors: {
          bulkUpdatedAt: bulk.updated_at,
          tags: oracleTags.length,
          skippedWeak,
          skippedNotInCatalog,
          skippedUnknownWeight,
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
