import { config } from "dotenv";

import { SyncSource, SyncStatus } from "../../src/generated/prisma/client";

config({ path: ".env.local" });
config({ path: ".env" });

async function main() {
  const { createScriptPrismaClient } = await import("../../src/lib/db");
  const prisma = createScriptPrismaClient();

  const syncLog = await prisma.syncLog.create({
    data: {
      source: SyncSource.SCRYFALL,
      jobType: "purge_art_series",
      status: SyncStatus.RUNNING,
    },
  });

  try {
    const artSeriesCount = await prisma.card.count({ where: { layout: "art_series" } });
    console.log(`Found ${artSeriesCount} art_series cards to remove.`);

    const deleted = await prisma.card.deleteMany({ where: { layout: "art_series" } });

    console.log(`Deleted ${deleted.count} art_series cards.`);

    await prisma.syncLog.update({
      where: { id: syncLog.id },
      data: {
        status: SyncStatus.SUCCESS,
        completedAt: new Date(),
        recordsProcessed: deleted.count,
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
