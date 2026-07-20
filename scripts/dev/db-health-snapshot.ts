import { config } from "dotenv";

config({ path: ".env.local" });
config({ path: ".env" });

async function main() {
  const { createScriptPrismaClient } = await import("../../src/lib/db");
  const prisma = createScriptPrismaClient();

  const tableSizes = await prisma.$queryRaw<
    Array<{ table_name: string; total_size: string; heap_size: string }>
  >`
    SELECT relname AS table_name,
           pg_size_pretty(pg_total_relation_size(quote_ident(relname))) AS total_size,
           pg_size_pretty(pg_relation_size(quote_ident(relname))) AS heap_size
    FROM pg_stat_user_tables
    WHERE relname IN (
      'cards','printings','card_classifications',
      'card_oracle_taggings','scryfall_oracle_tags','mtg_sets','sync_logs'
    )
    ORDER BY pg_total_relation_size(quote_ident(relname)) DESC
  `;

  const counts = {
    cards: await prisma.card.count(),
    commanders: await prisma.card.count({ where: { isCommander: true } }),
    withPopularity: await prisma.card.count({ where: { popularityRank: { not: null } } }),
    gameChangers: await prisma.card.count({ where: { isGameChanger: true } }),
    withFriction: await prisma.card.count({ where: { frictionScore: { gt: 0 } } }),
    classifications: await prisma.cardClassification.count(),
    printings: await prisma.printing.count(),
    sets: await prisma.mtgSet.count(),
    syncLogs: await prisma.syncLog.count(),
  };

  const dbSize = await prisma.$queryRaw<Array<{ size: string }>>`
    SELECT pg_size_pretty(pg_database_size(current_database())) AS size
  `;

  console.log("=== MTGPlayground DB snapshot ===\n");
  console.log("Database size:", dbSize[0]?.size);
  console.log("\nTable sizes:");
  console.table(tableSizes);
  console.log("\nRow counts:");
  console.table(counts);

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
