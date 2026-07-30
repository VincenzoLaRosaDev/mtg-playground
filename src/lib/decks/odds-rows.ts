/**
 * Row sources for deck Odds (Probability) — reuses Quantity buckets + card names.
 */

import {
  isCommanderLikeFormat,
  type DeckBoard,
} from "@/lib/decks/boards";
import type {
  DeckQuantityBreakdowns,
  QuantityBucket,
  QuantityBreakdownMode,
} from "@/lib/decks/quantity-breakdowns";
import { quantitiesForMode } from "@/lib/decks/quantity-breakdowns";

const COUNTED_BOARDS = new Set<DeckBoard>(["main", "commander"]);

export type OddsFacetMode =
  | "cardName"
  | "role"
  | "type"
  | "subtype"
  | "manaValue"
  | "keyword";

export const ODDS_FACET_OPTIONS: { value: OddsFacetMode; label: string }[] = [
  { value: "cardName", label: "Card Name" },
  { value: "role", label: "Roles" },
  { value: "type", label: "Types" },
  { value: "subtype", label: "Subtypes" },
  { value: "manaValue", label: "Mana value" },
  { value: "keyword", label: "Keywords" },
];

const ODDS_FACET_SET = new Set<string>(ODDS_FACET_OPTIONS.map((o) => o.value));

export function isOddsFacetMode(value: string): value is OddsFacetMode {
  return ODDS_FACET_SET.has(value);
}

/**
 * Singleton / commander-like: default Types (Card Name is mostly 1-ofs).
 * Multi-copy constructed: default Card Name.
 */
export function defaultOddsFacetForFormat(format: string): OddsFacetMode {
  return isCommanderLikeFormat(format) ? "type" : "cardName";
}

export type OddsCardNameInput = {
  quantity: number;
  board: DeckBoard;
  name: string;
};

/** Aggregate main+commander quantities by card name (Archidekt Card Name). */
export function summarizeDeckCardNameQuantities(
  cards: readonly OddsCardNameInput[],
): QuantityBucket[] {
  const map = new Map<string, number>();
  for (const card of cards) {
    if (!COUNTED_BOARDS.has(card.board)) continue;
    if (card.quantity < 1) continue;
    const name = card.name.trim() || "Unknown card";
    map.set(name, (map.get(name) ?? 0) + card.quantity);
  }
  return [...map.entries()]
    .map(([name, count]) => ({ key: name, label: name, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

export function oddsBucketsForFacet(
  facet: OddsFacetMode,
  quantityBreakdowns: DeckQuantityBreakdowns,
  cardNameQuantities: QuantityBucket[],
): QuantityBucket[] {
  if (facet === "cardName") return cardNameQuantities;
  return quantitiesForMode(
    quantityBreakdowns,
    facet as QuantityBreakdownMode,
  );
}
