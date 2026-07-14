import { config } from "dotenv";

config({ path: ".env.local" });
config({ path: ".env" });

async function main() {
  const { createScriptPrismaClient } = await import("../../src/lib/db");
  const prisma = createScriptPrismaClient();

  const topByWindow = await prisma.$queryRaw<
    Array<{
      entity_type: string;
      window: string;
      cnt: number;
      min_rank: number;
      max_rank: number;
      last_sync: Date;
    }>
  >`
    SELECT entity_type, "window", COUNT(*)::int AS cnt,
           MIN(rank) AS min_rank, MAX(rank) AS max_rank,
           MAX(synced_at) AS last_sync
    FROM edhrec_top_entries
    GROUP BY 1, 2
    ORDER BY 1, 2
  `;

  const allWindow = await prisma.edhrecTopEntry.count({ where: { window: "ALL" } });

  const tableSizes = await prisma.$queryRaw<
    Array<{ table_name: string; total_size: string; heap_size: string }>
  >`
    SELECT relname AS table_name,
           pg_size_pretty(pg_total_relation_size(quote_ident(relname))) AS total_size,
           pg_size_pretty(pg_relation_size(quote_ident(relname))) AS heap_size
    FROM pg_stat_user_tables
    WHERE relname IN (
      'edhrec_top_entries','edhrec_commander_profiles','edhrec_card_data',
      'edhrec_page_variants','cards','set_cards','card_classifications',
      'card_oracle_taggings','sync_logs'
    )
    ORDER BY pg_total_relation_size(quote_ident(relname)) DESC
  `;

  const counts = {
    cards: await prisma.card.count(),
    commanderProfiles: await prisma.edhrecCommanderProfile.count(),
    cardData: await prisma.edhrecCardData.count(),
    pageVariants: await prisma.edhrecPageVariant.count(),
    topEntries: await prisma.edhrecTopEntry.count(),
    classifications: await prisma.cardClassification.count(),
    setCards: await prisma.setCard.count(),
  };

  const syncLog = await prisma.syncLog.findFirst({
    where: { jobType: "top_lists" },
    orderBy: { startedAt: "desc" },
    select: { status: true, startedAt: true, completedAt: true, recordsProcessed: true },
  });

  const cardTiers = await prisma.$queryRaw<Array<{ sync_tier: string; cnt: number }>>`
    SELECT sync_tier, COUNT(*)::int AS cnt FROM edhrec_card_data GROUP BY 1 ORDER BY 1
  `;
  const cmdTiers = await prisma.$queryRaw<Array<{ sync_tier: string; cnt: number }>>`
    SELECT sync_tier, COUNT(*)::int AS cnt FROM edhrec_commander_profiles GROUP BY 1 ORDER BY 1
  `;

  const dbSize = await prisma.$queryRaw<Array<{ size: string }>>`
    SELECT pg_size_pretty(pg_database_size(current_database())) AS size
  `;

  console.log("=== EDHForge DB snapshot ===\n");
  console.log("Database size:", dbSize[0]?.size);
  console.log("\nTop entries by entity/window:");
  console.table(topByWindow);
  console.log("ALL window rows:", allWindow);
  console.log("\nTable sizes:");
  console.table(tableSizes);
  console.log("\nRow counts:");
  console.table(counts);
  console.log("\nLast top_lists sync:");
  console.table(syncLog ? [syncLog] : []);
  console.log("\nCard data tiers:");
  console.table(cardTiers);
  console.log("\nCommander profile tiers:");
  console.table(cmdTiers);

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
