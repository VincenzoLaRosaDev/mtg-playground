import { config } from "dotenv";

config({ path: ".env.local" });
config({ path: ".env" });

async function main() {
  const { createScriptPrismaClient } = await import("../../src/lib/db");
  const prisma = createScriptPrismaClient();

  const cards = await prisma.card.count();
  const commanders = await prisma.card.count({ where: { isCommander: true } });
  const withSlug = await prisma.card.count({ where: { slug: { not: null } } });
  const sample = await prisma.card.findFirst({
    where: { slug: "sol-ring" },
    select: { name: true, slug: true, isCommander: true },
  });

  console.log({ cards, commanders, withSlug, sample });
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
