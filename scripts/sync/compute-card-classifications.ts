import { config } from "dotenv";

import { ClassificationSource, SyncSource, SyncStatus } from "../../src/generated/prisma/client";
import type { PrismaClient } from "../../src/generated/prisma/client";
import {
  classifyFromOracleTags,
  classifyFromOverride,
  hasClassification,
} from "../../src/lib/classification/compute";
import { computeFrictionScore } from "../../src/lib/classification/friction";
import { loadCardOverrides } from "../../src/lib/classification/overrides";

config({ path: ".env.local" });
config({ path: ".env" });

const JOB_TYPE = "card_classifications_compute";
const UPSERT_BATCH = 200;

async function loadTagSlugsByOracleId(
  prisma: PrismaClient,
): Promise<Map<string, string[]>> {
  const rows = await prisma.$queryRaw<Array<{ oracle_id: string; slug: string }>>`
    SELECT cot.oracle_id, sot.slug
    FROM card_oracle_taggings cot
    INNER JOIN scryfall_oracle_tags sot ON sot.id = cot.tag_id
    WHERE cot.weight != 'weak'
  `;

  const map = new Map<string, string[]>();

  for (const row of rows) {
    const existing = map.get(row.oracle_id) ?? [];
    existing.push(row.slug);
    map.set(row.oracle_id, existing);
  }

  return map;
}

async function main() {
  const { createScriptPrismaClient } = await import("../../src/lib/db");
  const prisma = createScriptPrismaClient();

  const syncLog = await prisma.syncLog.create({
    data: {
      source: SyncSource.SCRYFALL,
      jobType: JOB_TYPE,
      status: SyncStatus.RUNNING,
    },
  });

  try {
    console.log("Loading card overrides...");
    const overrides = loadCardOverrides();

    console.log("Loading oracle tag slugs by card...");
    const tagSlugsByOracleId = await loadTagSlugsByOracleId(prisma);

    const catalogOracleIds = await prisma.card.findMany({ select: { oracleId: true } });
    const oracleIds = new Set(catalogOracleIds.map((row) => row.oracleId));

    for (const oracleId of overrides.keys()) {
      oracleIds.add(oracleId);
    }

    const toUpsert: Array<{
      oracleId: string;
      roles: string[];
      themes: string[];
      source: ClassificationSource;
      tagSlugs: string[];
    }> = [];

    let overrideCount = 0;
    let tagCount = 0;

    for (const oracleId of oracleIds) {
      const override = overrides.get(oracleId);
      if (override) {
        const result = classifyFromOverride(override);
        if (!hasClassification(result)) continue;
        toUpsert.push({
          oracleId,
          roles: result.roles,
          themes: result.themes,
          source: ClassificationSource.OVERRIDE,
          tagSlugs: [],
        });
        overrideCount += 1;
        continue;
      }

      const tagSlugs = tagSlugsByOracleId.get(oracleId);
      if (!tagSlugs?.length) continue;

      const result = classifyFromOracleTags(tagSlugs);
      if (!hasClassification(result)) continue;

      toUpsert.push({
        oracleId,
        roles: result.roles,
        themes: result.themes,
        source: ClassificationSource.ORACLE_TAG,
        tagSlugs: result.tagSlugs,
      });
      tagCount += 1;
    }

    console.log(`Replacing ${toUpsert.length} classifications (${overrideCount} overrides, ${tagCount} from tags)...`);
    await prisma.cardClassification.deleteMany();

    for (let i = 0; i < toUpsert.length; i += UPSERT_BATCH) {
      const batch = toUpsert.slice(i, i + UPSERT_BATCH);
      await prisma.cardClassification.createMany({ data: batch });
    }

    console.log("Updating friction scores...");
    // Reset to GC-only baseline, then add tag friction for tagged cards.
    await prisma.$executeRaw`
      UPDATE cards
      SET friction_score = CASE WHEN is_game_changer THEN 2 ELSE 0 END
    `;

    const cards = await prisma.card.findMany({
      select: { id: true, oracleId: true, isGameChanger: true },
    });
    let frictionUpdated = 0;
    for (let i = 0; i < cards.length; i += UPSERT_BATCH) {
      const batch = cards.slice(i, i + UPSERT_BATCH);
      await Promise.all(
        batch.map(async (card) => {
          const tagSlugs = tagSlugsByOracleId.get(card.oracleId) ?? [];
          const score = computeFrictionScore({
            isGameChanger: card.isGameChanger,
            tagSlugs,
          });
          // Skip no-op when score matches GC-only baseline already applied.
          const baseline = card.isGameChanger ? 2 : 0;
          if (score === baseline) return;
          await prisma.card.update({
            where: { id: card.id },
            data: { frictionScore: score },
          });
          frictionUpdated += 1;
        }),
      );
    }

    await prisma.syncLog.update({
      where: { id: syncLog.id },
      data: {
        status: SyncStatus.SUCCESS,
        completedAt: new Date(),
        recordsProcessed: toUpsert.length,
        errors: { overrideCount, tagCount, frictionUpdated },
      },
    });

    console.log(
      `Done. ${toUpsert.length} classifications; ${frictionUpdated} friction scores above GC baseline.`,
    );
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
