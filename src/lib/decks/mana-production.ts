/**
 * Mana production from Scryfall `produced_mana` (Phase Archidekt Colors).
 * Counts main + commander. Optional lands-only filter.
 */

import type { DeckBoard } from "@/lib/decks/boards";
import { primaryTypeGroupId } from "@/lib/decks/card-type-groups";
import type { ManaColorKey } from "@/lib/decks/composition";

const COUNTED_BOARDS = new Set<DeckBoard>(["main", "commander"]);
const COLOR_ORDER: ManaColorKey[] = ["W", "U", "B", "R", "G", "C"];

const COLOR_LABEL: Record<ManaColorKey, string> = {
  W: "White",
  U: "Blue",
  B: "Black",
  R: "Red",
  G: "Green",
  C: "Colorless",
};

export type DeckManaProductionCardInput = {
  quantity: number;
  board: DeckBoard;
  typeLine: string;
  /** Scryfall produced_mana colors, e.g. ["B","G"]. */
  producedMana: string[];
};

export type ManaProductionBucket = {
  key: ManaColorKey;
  label: string;
  /** Sources × qty (each color on a card counts once per copy). */
  mana: number;
  cards: number;
};

export type DeckManaProduction = {
  buckets: ManaProductionBucket[];
  totalSources: number;
};

function normalizeProduced(colors: string[]): ManaColorKey[] {
  const out: ManaColorKey[] = [];
  for (const raw of colors) {
    const c = raw.trim().toUpperCase();
    if (c === "W" || c === "U" || c === "B" || c === "R" || c === "G") {
      out.push(c);
    } else if (c === "C") {
      out.push("C");
    }
  }
  return out;
}

export function summarizeDeckManaProduction(
  cards: readonly DeckManaProductionCardInput[],
  options?: { landsOnly?: boolean },
): DeckManaProduction {
  const landsOnly = options?.landsOnly ?? false;
  const manaMap = new Map<ManaColorKey, number>();
  const cardMap = new Map<ManaColorKey, number>();
  for (const key of COLOR_ORDER) {
    manaMap.set(key, 0);
    cardMap.set(key, 0);
  }

  for (const card of cards) {
    if (!COUNTED_BOARDS.has(card.board)) continue;
    if (card.quantity < 1) continue;
    if (landsOnly && primaryTypeGroupId(card.typeLine) !== "land") continue;

    const colors = normalizeProduced(card.producedMana);
    if (colors.length === 0) continue;

    const unique = [...new Set(colors)];
    for (const color of unique) {
      manaMap.set(color, (manaMap.get(color) ?? 0) + card.quantity);
      cardMap.set(color, (cardMap.get(color) ?? 0) + card.quantity);
    }
  }

  const buckets: ManaProductionBucket[] = [];
  let totalSources = 0;
  for (const key of COLOR_ORDER) {
    const mana = manaMap.get(key) ?? 0;
    const cardsCount = cardMap.get(key) ?? 0;
    if (mana <= 0) continue;
    totalSources += mana;
    buckets.push({
      key,
      label: COLOR_LABEL[key],
      mana,
      cards: cardsCount,
    });
  }

  return { buckets, totalSources };
}
