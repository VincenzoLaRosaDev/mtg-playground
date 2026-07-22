import type { PrismaClient } from "@/generated/prisma/client";

import { isSetRarity, RARITY_RANK } from "@/lib/mtg/rarity-rank";
import type { SetRarity } from "@/lib/mtg/rarity-types";

/**
 * Oracle IDs whose **lowest** printing rarity tier is one of the selected values.
 * Uses denormalized `cards.min_rarity_rank` (refreshed at printings sync).
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

  const rows = await prisma.card.findMany({
    where: { minRarityRank: { in: ranks } },
    select: { oracleId: true },
  });

  return rows.map((row) => row.oracleId);
}
