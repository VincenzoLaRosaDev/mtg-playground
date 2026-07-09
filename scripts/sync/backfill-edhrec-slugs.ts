import { config } from "dotenv";

import { toEdhrecSlug } from "../../src/lib/scryfall/card-utils";

config({ path: ".env.local" });
config({ path: ".env" });

const BATCH_SIZE = 500;

async function main() {
  const { createScriptPrismaClient } = await import("../../src/lib/db");
  const prisma = createScriptPrismaClient();

  let cursor: string | undefined;
  let updated = 0;
  let scanned = 0;

  try {
    while (true) {
      const cards = await prisma.card.findMany({
        select: { id: true, name: true, edhrecSlug: true },
        orderBy: { id: "asc" },
        take: BATCH_SIZE,
        ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      });

      if (cards.length === 0) {
        break;
      }

      for (const card of cards) {
        scanned += 1;
        const nextSlug = toEdhrecSlug(card.name);

        if (nextSlug !== card.edhrecSlug) {
          await prisma.card.update({
            where: { id: card.id },
            data: { edhrecSlug: nextSlug },
          });
          updated += 1;
        }
      }

      cursor = cards[cards.length - 1]?.id;
      process.stdout.write(`\rScanned ${scanned}, updated ${updated}...`);
    }

    console.log(`\nDone. ${updated} cards updated out of ${scanned} scanned.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
