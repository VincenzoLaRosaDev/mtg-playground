import { config } from "dotenv";

import { SyncSource, SyncStatus } from "../../src/generated/prisma/client";
import { resolvePlayableCardId } from "../../src/lib/scryfall/catalog-filters";

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

    let commanderRelinked = 0;
    const commanderProfiles = await prisma.edhrecCommanderProfile.findMany({
      select: { id: true, slug: true, cardId: true },
    });

    for (const profile of commanderProfiles) {
      const cardId = await resolvePlayableCardId(prisma, profile.slug);
      if (cardId !== profile.cardId) {
        await prisma.edhrecCommanderProfile.update({
          where: { id: profile.id },
          data: { cardId },
        });
        commanderRelinked += 1;
      }
    }

    let cardDataRelinked = 0;
    const cardDataRows = await prisma.edhrecCardData.findMany({
      select: { id: true, slug: true, cardId: true },
    });

    for (const row of cardDataRows) {
      const cardId = await resolvePlayableCardId(prisma, row.slug);
      if (cardId !== row.cardId) {
        await prisma.edhrecCardData.update({
          where: { id: row.id },
          data: { cardId },
        });
        cardDataRelinked += 1;
      }
    }

    const deleted = await prisma.card.deleteMany({ where: { layout: "art_series" } });

    console.log(
      `Relinked ${commanderRelinked} commander profiles and ${cardDataRelinked} card data rows.`,
    );
    console.log(`Deleted ${deleted.count} art_series cards.`);

    await prisma.syncLog.update({
      where: { id: syncLog.id },
      data: {
        status: SyncStatus.SUCCESS,
        completedAt: new Date(),
        recordsProcessed: deleted.count,
        errors: {
          commanderRelinked,
          cardDataRelinked,
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
