import { SET_RARITIES } from "@/lib/scryfall/sets";

export type SetRarity = (typeof SET_RARITIES)[number];

export function isSetRarity(value: string): value is SetRarity {
  return (SET_RARITIES as readonly string[]).includes(value);
}
