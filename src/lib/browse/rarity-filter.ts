import { SET_RARITIES } from "@/lib/scryfall/sets";
import { isSetRarity } from "@/lib/mtg/rarity-rank";
import type { SetRarity } from "@/lib/mtg/rarity-types";

export { SET_RARITIES };

export function parseRaritiesParam(value: string | null | undefined): string[] {
  if (!value?.trim()) {
    return [];
  }

  return value
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter((entry): entry is SetRarity => isSetRarity(entry));
}

export function raritiesToParam(rarities: string[]): string | undefined {
  return rarities.length > 0 ? rarities.join(",") : undefined;
}

export function toggleRaritySelection(rarities: string[], rarity: string): string[] {
  return rarities.includes(rarity)
    ? rarities.filter((value) => value !== rarity)
    : [...rarities, rarity];
}
