/**
 * “Quantity of” facets (Archidekt Quantities): Roles · Types · Subtypes ·
 * Supertypes · Mana value · Keywords. Main + commander.
 */

import { FUNCTIONAL_ROLES } from "@/lib/classification/types";
import type { DeckBoard } from "@/lib/decks/boards";
import {
  primaryTypeGroupId,
  typeGroupLabel,
  type DeckCardTypeGroupId,
} from "@/lib/decks/card-type-groups";
import { frontFaceSubtypes } from "@/lib/decks/curve-breakdowns";

const COUNTED_BOARDS = new Set<DeckBoard>(["main", "commander"]);

/** Official MTG supertypes (Scryfall type-line words). */
export const MTG_SUPERTYPES = [
  "Basic",
  "Legendary",
  "Snow",
  "World",
  "Ongoing",
] as const;

const TYPE_ORDER: DeckCardTypeGroupId[] = [
  "creature",
  "planeswalker",
  "instant",
  "sorcery",
  "artifact",
  "enchantment",
  "battle",
  "land",
  "other",
];

export type QuantityBreakdownCardInput = {
  quantity: number;
  board: DeckBoard;
  cmc: number;
  typeLine: string;
  keywords: string[];
  roles: string[];
};

export type QuantityBucket = {
  key: string;
  label: string;
  count: number;
};

export type DeckQuantityBreakdowns = {
  byRole: QuantityBucket[];
  byType: QuantityBucket[];
  bySubtype: QuantityBucket[];
  bySupertype: QuantityBucket[];
  byManaValue: QuantityBucket[];
  byKeyword: QuantityBucket[];
};

export type QuantityBreakdownMode =
  | "role"
  | "type"
  | "subtype"
  | "supertype"
  | "manaValue"
  | "keyword";

export const QUANTITY_BREAKDOWN_OPTIONS: {
  value: QuantityBreakdownMode;
  label: string;
}[] = [
  { value: "type", label: "Types" },
  { value: "role", label: "Roles" },
  { value: "subtype", label: "Subtypes" },
  { value: "supertype", label: "Supertypes" },
  { value: "manaValue", label: "Mana value" },
  { value: "keyword", label: "Keywords" },
];

const QUANTITY_MODE_SET = new Set<string>(
  QUANTITY_BREAKDOWN_OPTIONS.map((o) => o.value),
);

export function isQuantityBreakdownMode(
  value: string,
): value is QuantityBreakdownMode {
  return QUANTITY_MODE_SET.has(value);
}

function facetLabel(key: string): string {
  return key.replaceAll("_", " ");
}

function manaValueKey(cmc: number): { key: string; label: string } {
  const n = Math.max(0, Math.floor(cmc));
  if (n >= 7) return { key: "7+", label: "7+" };
  return { key: String(n), label: String(n) };
}

/** Supertypes on the front face type words (before subtypes dash). */
export function frontFaceSupertypes(typeLine: string): string[] {
  const front = (typeLine.split("//")[0] ?? typeLine).trim();
  const typePart = (front.split(/\s+[—–-]\s+/)[0] ?? front).trim();
  const found: string[] = [];
  for (const superType of MTG_SUPERTYPES) {
    if (new RegExp(`\\b${superType}\\b`, "i").test(typePart)) {
      found.push(superType);
    }
  }
  return found;
}

function addCount(map: Map<string, number>, key: string, qty: number): void {
  map.set(key, (map.get(key) ?? 0) + qty);
}

function bucketsFromMap(
  map: Map<string, number>,
  options?: {
    order?: readonly string[];
    labelFor?: (key: string) => string;
    includeZeros?: boolean;
  },
): QuantityBucket[] {
  const labelFor = options?.labelFor ?? ((key: string) => key);
  if (options?.order) {
    return options.order
      .map((key) => ({
        key,
        label: labelFor(key),
        count: map.get(key) ?? 0,
      }))
      .filter((row) => options.includeZeros || row.count > 0);
  }
  return [...map.entries()]
    .map(([key, count]) => ({ key, label: labelFor(key), count }))
    .filter((row) => row.count > 0)
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

/**
 * Quantity histograms for main + commander (lands included except where noted).
 */
export function summarizeDeckQuantityBreakdowns(
  cards: readonly QuantityBreakdownCardInput[],
): DeckQuantityBreakdowns {
  const roleMap = new Map<string, number>();
  const typeMap = new Map<string, number>();
  const subtypeMap = new Map<string, number>();
  const supertypeMap = new Map<string, number>();
  const mvMap = new Map<string, number>();
  const keywordMap = new Map<string, number>();

  for (const card of cards) {
    if (!COUNTED_BOARDS.has(card.board)) continue;
    if (card.quantity < 1) continue;

    const qty = card.quantity;
    const typeId = primaryTypeGroupId(card.typeLine);
    addCount(typeMap, typeId, qty);

    const { key: mvKey } = manaValueKey(card.cmc);
    addCount(mvMap, mvKey, qty);

    const roles = card.roles.filter(Boolean);
    if (roles.length === 0) {
      addCount(roleMap, "uncategorized", qty);
    } else {
      for (const role of roles) {
        addCount(roleMap, role, qty);
      }
    }

    for (const subtype of frontFaceSubtypes(card.typeLine)) {
      addCount(subtypeMap, subtype, qty);
    }

    for (const superType of frontFaceSupertypes(card.typeLine)) {
      addCount(supertypeMap, superType, qty);
    }

    for (const keyword of card.keywords) {
      const k = keyword.trim();
      if (!k) continue;
      addCount(keywordMap, k, qty);
    }
  }

  const roleOrder = [...FUNCTIONAL_ROLES, "uncategorized"];
  const mvOrder = ["0", "1", "2", "3", "4", "5", "6", "7+"];

  return {
    byRole: bucketsFromMap(roleMap, {
      order: roleOrder,
      labelFor: (key) =>
        key === "uncategorized" ? "Uncategorized" : facetLabel(key),
    }),
    byType: bucketsFromMap(typeMap, {
      order: TYPE_ORDER,
      labelFor: (key) => typeGroupLabel(key as DeckCardTypeGroupId),
    }),
    bySubtype: bucketsFromMap(subtypeMap),
    bySupertype: bucketsFromMap(supertypeMap, {
      order: MTG_SUPERTYPES,
    }),
    byManaValue: bucketsFromMap(mvMap, {
      order: mvOrder,
      includeZeros: false,
    }),
    byKeyword: bucketsFromMap(keywordMap),
  };
}

export function quantitiesForMode(
  breakdowns: DeckQuantityBreakdowns,
  mode: QuantityBreakdownMode,
): QuantityBucket[] {
  switch (mode) {
    case "role":
      return breakdowns.byRole;
    case "type":
      return breakdowns.byType;
    case "subtype":
      return breakdowns.bySubtype;
    case "supertype":
      return breakdowns.bySupertype;
    case "manaValue":
      return breakdowns.byManaValue;
    case "keyword":
      return breakdowns.byKeyword;
  }
}
