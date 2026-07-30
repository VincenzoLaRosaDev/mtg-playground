/**
 * Color pip costs from Scryfall manaCost strings (Phase Archidekt Colors tab).
 * Counts main + commander; lands excluded from cost (spell pips).
 */

import type { DeckBoard } from "@/lib/decks/boards";
import { primaryTypeGroupId } from "@/lib/decks/card-type-groups";
import type { ManaColorKey } from "@/lib/decks/composition";
import { parseManaCost } from "@/lib/mtg/mana-cost";

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

export type DeckManaPipCardInput = {
  quantity: number;
  board: DeckBoard;
  typeLine: string;
  manaCost: string | null;
};

export type ManaPipBucket = {
  key: ManaColorKey;
  label: string;
  /** Colored / colorless symbol occurrences × qty. */
  pips: number;
  /** Distinct card copies that contribute ≥1 pip of this color. */
  cards: number;
};

export type DeckManaPips = {
  buckets: ManaPipBucket[];
  totalPips: number;
};

/** Map a single brace token to zero or more pip colors. */
export function pipColorsFromToken(token: string): ManaColorKey[] {
  const t = token.trim().toUpperCase();
  if (!t) return [];
  // Numeric / variable / snow / ticket — not color pips.
  if (/^\d+$/.test(t) || t === "X" || t === "Y" || t === "Z" || t === "S") {
    return [];
  }
  if (t === "C") return ["C"];

  // Hybrid / Phyrexian: W/U, W/P, 2/W, W/U/P …
  const parts = t.split("/");
  const colors: ManaColorKey[] = [];
  for (const part of parts) {
    if (part === "W" || part === "U" || part === "B" || part === "R" || part === "G") {
      colors.push(part);
    } else if (part === "C") {
      colors.push("C");
    }
    // "2", "P", etc. ignored
  }
  return colors;
}

export function summarizeDeckManaPips(
  cards: readonly DeckManaPipCardInput[],
): DeckManaPips {
  const pipMap = new Map<ManaColorKey, number>();
  const cardMap = new Map<ManaColorKey, number>();
  for (const key of COLOR_ORDER) {
    pipMap.set(key, 0);
    cardMap.set(key, 0);
  }

  for (const card of cards) {
    if (!COUNTED_BOARDS.has(card.board)) continue;
    if (card.quantity < 1) continue;
    if (primaryTypeGroupId(card.typeLine) === "land") continue;

    const tokens = parseManaCost(card.manaCost);
    const cardPips = new Map<ManaColorKey, number>();
    for (const token of tokens) {
      for (const color of pipColorsFromToken(token)) {
        cardPips.set(color, (cardPips.get(color) ?? 0) + 1);
      }
    }

    for (const [color, n] of cardPips) {
      pipMap.set(color, (pipMap.get(color) ?? 0) + n * card.quantity);
      cardMap.set(color, (cardMap.get(color) ?? 0) + card.quantity);
    }
  }

  const buckets: ManaPipBucket[] = [];
  let totalPips = 0;
  for (const key of COLOR_ORDER) {
    const pips = pipMap.get(key) ?? 0;
    const cardsCount = cardMap.get(key) ?? 0;
    if (pips <= 0) continue;
    totalPips += pips;
    buckets.push({
      key,
      label: COLOR_LABEL[key],
      pips,
      cards: cardsCount,
    });
  }

  return { buckets, totalPips };
}
