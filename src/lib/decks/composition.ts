/**
 * Deck composition stats (Phase 3.1): mana curve, types, lands, colors.
 * Counts main + commander only (same grain as insights).
 */

import type { DeckBoard } from "@/lib/decks/boards";
import {
  primaryTypeGroupId,
  typeGroupLabel,
  type DeckCardTypeGroupId,
} from "@/lib/decks/card-type-groups";

const COUNTED_BOARDS = new Set<DeckBoard>(["main", "commander"]);

const COLOR_ORDER = ["W", "U", "B", "R", "G"] as const;
export type ManaColorKey = (typeof COLOR_ORDER)[number] | "C";

export type DeckCompositionCardInput = {
  quantity: number;
  board: DeckBoard;
  cmc: number;
  typeLine: string;
  colorIdentity: string[];
};

export type CurveBucket = {
  /** Label: "0"…"6" or "7+". */
  key: string;
  cmc: number;
  count: number;
};

export type TypeBucket = {
  id: DeckCardTypeGroupId;
  label: string;
  count: number;
};

export type ColorBucket = {
  key: ManaColorKey;
  label: string;
  count: number;
};

export type DeckComposition = {
  countedCopies: number;
  landCopies: number;
  nonlandCopies: number;
  /** Land share of counted copies (0–100), or 0 when empty. */
  landPercent: number;
  /** Sum of CMC × qty for nonlands (main + commander). */
  totalManaValue: number;
  /** Average CMC of nonland copies; 0 when none. */
  avgManaValue: number;
  /** Mana curve for nonland cards, CMC 0–6 and 7+. */
  curve: CurveBucket[];
  types: TypeBucket[];
  colors: ColorBucket[];
};

function isCountedBoard(board: DeckBoard): boolean {
  return COUNTED_BOARDS.has(board);
}

function isLand(typeLine: string): boolean {
  return primaryTypeGroupId(typeLine) === "land";
}

function curveKey(cmc: number): { key: string; cmc: number } {
  const n = Math.max(0, Math.floor(cmc));
  if (n >= 7) return { key: "7+", cmc: 7 };
  return { key: String(n), cmc: n };
}

const COLOR_LABEL: Record<ManaColorKey, string> = {
  W: "White",
  U: "Blue",
  B: "Black",
  R: "Red",
  G: "Green",
  C: "Colorless",
};

/**
 * Aggregate composition for the open deck (main + commander).
 */
export function summarizeDeckComposition(
  cards: readonly DeckCompositionCardInput[],
): DeckComposition {
  let countedCopies = 0;
  let landCopies = 0;
  let nonlandCopies = 0;

  const curveMap = new Map<number, number>();
  for (let i = 0; i <= 7; i++) curveMap.set(i, 0);

  const typeMap = new Map<DeckCardTypeGroupId, number>();
  const colorMap = new Map<ManaColorKey, number>();

  for (const card of cards) {
    if (!isCountedBoard(card.board)) continue;
    const qty = card.quantity;
    if (qty < 1) continue;

    countedCopies += qty;
    const land = isLand(card.typeLine);
    if (land) {
      landCopies += qty;
    } else {
      nonlandCopies += qty;
      const { cmc } = curveKey(card.cmc);
      curveMap.set(cmc, (curveMap.get(cmc) ?? 0) + qty);
    }

    const typeId = primaryTypeGroupId(card.typeLine);
    typeMap.set(typeId, (typeMap.get(typeId) ?? 0) + qty);

    const identity = card.colorIdentity
      .map((c) => c.toUpperCase())
      .filter((c): c is (typeof COLOR_ORDER)[number] =>
        (COLOR_ORDER as readonly string[]).includes(c),
      );
    if (identity.length === 0) {
      colorMap.set("C", (colorMap.get("C") ?? 0) + qty);
    } else {
      for (const c of identity) {
        colorMap.set(c, (colorMap.get(c) ?? 0) + qty);
      }
    }
  }

  const curve: CurveBucket[] = [];
  for (let i = 0; i <= 6; i++) {
    curve.push({ key: String(i), cmc: i, count: curveMap.get(i) ?? 0 });
  }
  curve.push({ key: "7+", cmc: 7, count: curveMap.get(7) ?? 0 });

  const types: TypeBucket[] = (
    [
      "creature",
      "planeswalker",
      "instant",
      "sorcery",
      "artifact",
      "enchantment",
      "battle",
      "land",
      "other",
    ] as const
  )
    .map((id) => ({
      id,
      label: typeGroupLabel(id),
      count: typeMap.get(id) ?? 0,
    }))
    .filter((row) => row.count > 0);

  const colors: ColorBucket[] = [];
  for (const key of COLOR_ORDER) {
    const count = colorMap.get(key) ?? 0;
    if (count > 0) {
      colors.push({ key, label: COLOR_LABEL[key], count });
    }
  }
  const colorless = colorMap.get("C") ?? 0;
  if (colorless > 0) {
    colors.push({ key: "C", label: COLOR_LABEL.C, count: colorless });
  }

  const landPercent =
    countedCopies > 0
      ? Math.round((landCopies / countedCopies) * 1000) / 10
      : 0;

  let totalManaValue = 0;
  for (const card of cards) {
    if (!isCountedBoard(card.board)) continue;
    if (card.quantity < 1) continue;
    if (isLand(card.typeLine)) continue;
    totalManaValue += card.cmc * card.quantity;
  }
  totalManaValue = Math.round(totalManaValue * 100) / 100;
  const avgManaValue =
    nonlandCopies > 0
      ? Math.round((totalManaValue / nonlandCopies) * 100) / 100
      : 0;

  return {
    countedCopies,
    landCopies,
    nonlandCopies,
    landPercent,
    totalManaValue,
    avgManaValue,
    curve,
    types,
    colors,
  };
}
