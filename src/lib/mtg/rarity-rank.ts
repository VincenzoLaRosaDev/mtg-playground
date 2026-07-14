import type { SetRarity } from "@/lib/mtg/rarity-types";

/** Lowest → highest; used for oracle-level rarity (minimum printing tier). */
export const RARITY_RANK: Record<SetRarity, number> = {
  common: 0,
  uncommon: 1,
  rare: 2,
  mythic: 3,
  special: 4,
  bonus: 5,
};

export function isSetRarity(value: string): value is SetRarity {
  return value in RARITY_RANK;
}

export function rarityRank(value: string): number | null {
  return isSetRarity(value) ? RARITY_RANK[value] : null;
}

export function minimumRarity(rarities: string[]): SetRarity | null {
  let bestRank = Number.POSITIVE_INFINITY;
  let bestRarity: SetRarity | null = null;

  for (const rarity of rarities) {
    const rank = rarityRank(rarity);
    if (rank != null && rank < bestRank) {
      bestRank = rank;
      bestRarity = rarity as SetRarity;
    }
  }

  return bestRarity;
}
