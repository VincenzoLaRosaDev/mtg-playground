import type { SetRarity } from "@/lib/mtg/rarity-types";
import { isSetRarity } from "@/lib/mtg/rarity-rank";

const RARITY_LABELS: Record<SetRarity, string> = {
  common: "Common",
  uncommon: "Uncommon",
  rare: "Rare",
  mythic: "Mythic",
  special: "Special",
  bonus: "Bonus",
};

export function rarityLabel(rarity: SetRarity): string {
  return RARITY_LABELS[rarity];
}

export function formatRarityLabel(rarity: string): string {
  return isSetRarity(rarity) ? RARITY_LABELS[rarity] : rarity;
}
