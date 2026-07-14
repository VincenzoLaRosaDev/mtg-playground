import { config } from "dotenv";

config({ path: ".env.local" });
config({ path: ".env" });

async function main() {
  const { createScriptPrismaClient } = await import("../../src/lib/db");
  const prisma = createScriptPrismaClient();

  const result = await prisma.edhrecPageVariant.deleteMany({
    where: {
      expiresAt: { lt: new Date() },
    },
  });

  console.log(`Deleted ${result.count} expired edhrec_page_variants row(s).`);

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
