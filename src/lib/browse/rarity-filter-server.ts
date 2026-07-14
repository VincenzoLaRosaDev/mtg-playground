import { Prisma, type PrismaClient } from "@/generated/prisma/client";

import { isSetRarity, RARITY_RANK } from "@/lib/mtg/rarity-rank";
import type { SetRarity } from "@/lib/mtg/rarity-types";

/**
 * Oracle IDs whose **lowest** printing rarity tier is one of the selected values.
 * Avoids treating e.g. Sol Ring as mythic because of a single mythic printing.
 */
export async function resolveOracleIdsForRarities(
  prisma: PrismaClient,
  rarities: string[],
): Promise<string[]> {
  if (rarities.length === 0) {
    return [];
  }

  const ranks = rarities
    .filter((entry): entry is SetRarity => isSetRarity(entry))
    .map((entry) => RARITY_RANK[entry]);

  if (ranks.length === 0) {
    return [];
  }

  const rows = await prisma.$queryRaw<{ oracle_id: string }[]>`
    SELECT oracle_id
    FROM set_cards
    GROUP BY oracle_id
    HAVING MIN(
      CASE rarity
        WHEN 'common' THEN 0
        WHEN 'uncommon' THEN 1
        WHEN 'rare' THEN 2
        WHEN 'mythic' THEN 3
        WHEN 'special' THEN 4
        WHEN 'bonus' THEN 5
        ELSE 99
      END
    ) IN (${Prisma.join(ranks)})
  `;

  return rows.map((row) => row.oracle_id);
}
