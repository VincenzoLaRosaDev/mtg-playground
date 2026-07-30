/**
 * Mana curve facets for Archidekt-style “Mana curve by” (nonlands, main+commander).
 */

import { FUNCTIONAL_ROLES } from "@/lib/classification/types";
import type { DeckBoard } from "@/lib/decks/boards";
import {
  primaryTypeGroupId,
  typeGroupLabel,
  type DeckCardTypeGroupId,
} from "@/lib/decks/card-type-groups";
import type { CurveBucket, ManaColorKey } from "@/lib/decks/composition";
import { pipColorsFromToken } from "@/lib/decks/mana-pips";
import { parseManaCost } from "@/lib/mtg/mana-cost";
import { SET_RARITIES } from "@/lib/scryfall/sets";
import { parseSubtypes } from "@/lib/scryfall/type-utils";

const COUNTED_BOARDS = new Set<DeckBoard>(["main", "commander"]);

/** Cap subtype mini-curves; remainder merges into Other. */
export const CURVE_SUBTYPE_DISPLAY_LIMIT = 12;

const COLOR_KEYS: ManaColorKey[] = ["W", "U", "B", "R", "G", "C"];

const COLOR_SPELL_LABEL: Record<ManaColorKey, string> = {
  W: "White Spells",
  U: "Blue Spells",
  B: "Black Spells",
  R: "Red Spells",
  G: "Green Spells",
  C: "Colorless Spells",
};

const TYPE_KEYS: DeckCardTypeGroupId[] = [
  "creature",
  "planeswalker",
  "instant",
  "sorcery",
  "artifact",
  "enchantment",
  "battle",
  "other",
];

const ROLE_KEYS = [...FUNCTIONAL_ROLES, "uncategorized"] as const;
const RARITY_KEYS = [...SET_RARITIES, "unknown"] as const;

export type CurveBreakdownCardInput = {
  quantity: number;
  board: DeckBoard;
  cmc: number;
  typeLine: string;
  manaCost: string | null;
  colorIdentity: string[];
  /** Preferred (or catalog) printing rarity; null → unknown. */
  rarity: string | null;
  /** Classification roles for this oracle; empty → uncategorized. */
  roles: string[];
};

export type CurveSeries = {
  key: string;
  label: string;
  /** When set, UI uses ManaSymbol + Scryfall bar tint. */
  manaColor?: ManaColorKey;
  curve: CurveBucket[];
  total: number;
};

export type DeckCurveBreakdowns = {
  byColor: CurveSeries[];
  byType: CurveSeries[];
  byPermanence: CurveSeries[];
  byRole: CurveSeries[];
  bySubtype: CurveSeries[];
  byRarity: CurveSeries[];
};

export type CurveBreakdownMode =
  | "color"
  | "type"
  | "permanence"
  | "role"
  | "subtype"
  | "rarity";

export const CURVE_BREAKDOWN_OPTIONS: {
  value: CurveBreakdownMode;
  label: string;
}[] = [
  { value: "color", label: "Color" },
  { value: "permanence", label: "Permanent / non-permanent" },
  { value: "role", label: "Roles" },
  { value: "type", label: "Types" },
  { value: "subtype", label: "Subtypes" },
  { value: "rarity", label: "Rarity" },
];

const CURVE_BREAKDOWN_MODE_SET = new Set<string>(
  CURVE_BREAKDOWN_OPTIONS.map((o) => o.value),
);

export function isCurveBreakdownMode(
  value: string,
): value is CurveBreakdownMode {
  return CURVE_BREAKDOWN_MODE_SET.has(value);
}

function emptyCurve(): CurveBucket[] {
  const curve: CurveBucket[] = [];
  for (let i = 0; i <= 6; i++) {
    curve.push({ key: String(i), cmc: i, count: 0 });
  }
  curve.push({ key: "7+", cmc: 7, count: 0 });
  return curve;
}

function curveIndex(cmc: number): number {
  const n = Math.max(0, Math.floor(cmc));
  return n >= 7 ? 7 : n;
}

function isLand(typeLine: string): boolean {
  return primaryTypeGroupId(typeLine) === "land";
}

function facetLabel(key: string): string {
  return key.replaceAll("_", " ");
}

function rarityLabel(key: string): string {
  if (key === "unknown") return "Unknown";
  return key.charAt(0).toUpperCase() + key.slice(1);
}

/** Front-face subtypes only (DFC-safe). */
export function frontFaceSubtypes(typeLine: string): string[] {
  const front = (typeLine.split("//")[0] ?? typeLine).trim();
  return parseSubtypes(front);
}

/** Colored pips from manaCost; identity fallback; else colorless. */
export function spellColorKeys(card: {
  manaCost: string | null;
  colorIdentity: string[];
}): ManaColorKey[] {
  const fromCost = new Set<ManaColorKey>();
  for (const token of parseManaCost(card.manaCost)) {
    for (const color of pipColorsFromToken(token)) {
      if (color !== "C") fromCost.add(color);
    }
  }
  if (fromCost.size > 0) return [...fromCost];

  const fromIdentity = card.colorIdentity
    .map((c) => c.toUpperCase())
    .filter((c): c is Exclude<ManaColorKey, "C"> =>
      c === "W" || c === "U" || c === "B" || c === "R" || c === "G",
    );
  if (fromIdentity.length > 0) return fromIdentity;
  return ["C"];
}

function isPermanentType(typeId: DeckCardTypeGroupId): boolean {
  return (
    typeId === "creature" ||
    typeId === "planeswalker" ||
    typeId === "artifact" ||
    typeId === "enchantment" ||
    typeId === "battle"
  );
}

function normalizeRarity(rarity: string | null | undefined): string {
  const key = rarity?.trim().toLowerCase() ?? "";
  if ((SET_RARITIES as readonly string[]).includes(key)) return key;
  return "unknown";
}

function addToCurve(
  map: Map<string, number[]>,
  seriesKey: string,
  cmc: number,
  qty: number,
): void {
  let buckets = map.get(seriesKey);
  if (!buckets) {
    buckets = Array.from({ length: 8 }, () => 0);
    map.set(seriesKey, buckets);
  }
  buckets[curveIndex(cmc)] += qty;
}

function totalOf(counts: number[]): number {
  return counts.reduce((sum, n) => sum + n, 0);
}

function seriesFromMap(
  map: Map<string, number[]>,
  keys: readonly string[],
  labelFor: (key: string) => string,
  manaColorFor?: (key: string) => ManaColorKey | undefined,
): CurveSeries[] {
  return keys.map((key) => {
    const counts = map.get(key) ?? Array.from({ length: 8 }, () => 0);
    const curve = emptyCurve().map((bucket, i) => ({
      ...bucket,
      count: counts[i] ?? 0,
    }));
    return {
      key,
      label: labelFor(key),
      manaColor: manaColorFor?.(key),
      curve,
      total: totalOf(counts),
    };
  });
}

function buildSubtypeSeries(
  subtypeMap: Map<string, number[]>,
  noneCounts: number[],
): CurveSeries[] {
  const ranked = [...subtypeMap.entries()]
    .map(([key, counts]) => ({ key, counts, total: totalOf(counts) }))
    .filter((row) => row.total > 0)
    .sort((a, b) => b.total - a.total || a.key.localeCompare(b.key));

  const top = ranked.slice(0, CURVE_SUBTYPE_DISPLAY_LIMIT);
  const rest = ranked.slice(CURVE_SUBTYPE_DISPLAY_LIMIT);

  const otherCounts = Array.from({ length: 8 }, () => 0);
  for (const row of rest) {
    for (let i = 0; i < 8; i++) {
      otherCounts[i] += row.counts[i] ?? 0;
    }
  }

  const series: CurveSeries[] = top.map((row) => ({
    key: row.key,
    label: row.key,
    curve: emptyCurve().map((bucket, i) => ({
      ...bucket,
      count: row.counts[i] ?? 0,
    })),
    total: row.total,
  }));

  if (totalOf(otherCounts) > 0) {
    series.push({
      key: "other",
      label: "Other subtypes",
      curve: emptyCurve().map((bucket, i) => ({
        ...bucket,
        count: otherCounts[i] ?? 0,
      })),
      total: totalOf(otherCounts),
    });
  }

  series.push({
    key: "none",
    label: "No subtype",
    curve: emptyCurve().map((bucket, i) => ({
      ...bucket,
      count: noneCounts[i] ?? 0,
    })),
    total: totalOf(noneCounts),
  });

  return series;
}

/**
 * Faceted nonland mana curves (main + commander). Multicolor spells appear in
 * each of their cost colors; multi-role / multi-subtype cards likewise.
 */
export function summarizeDeckCurveBreakdowns(
  cards: readonly CurveBreakdownCardInput[],
): DeckCurveBreakdowns {
  const byColorMap = new Map<string, number[]>();
  const byTypeMap = new Map<string, number[]>();
  const byPermanenceMap = new Map<string, number[]>();
  const byRoleMap = new Map<string, number[]>();
  const bySubtypeMap = new Map<string, number[]>();
  const byRarityMap = new Map<string, number[]>();
  const subtypeNone = Array.from({ length: 8 }, () => 0);

  for (const card of cards) {
    if (!COUNTED_BOARDS.has(card.board)) continue;
    if (card.quantity < 1) continue;
    if (isLand(card.typeLine)) continue;

    const qty = card.quantity;
    const cmc = card.cmc;

    for (const color of spellColorKeys(card)) {
      addToCurve(byColorMap, color, cmc, qty);
    }

    const typeId = primaryTypeGroupId(card.typeLine);
    if (typeId !== "land") {
      addToCurve(byTypeMap, typeId, cmc, qty);
    }

    addToCurve(
      byPermanenceMap,
      isPermanentType(typeId) ? "permanent" : "nonpermanent",
      cmc,
      qty,
    );

    const roles = card.roles.filter(Boolean);
    if (roles.length === 0) {
      addToCurve(byRoleMap, "uncategorized", cmc, qty);
    } else {
      for (const role of roles) {
        addToCurve(byRoleMap, role, cmc, qty);
      }
    }

    const subtypes = frontFaceSubtypes(card.typeLine);
    if (subtypes.length === 0) {
      subtypeNone[curveIndex(cmc)] += qty;
    } else {
      for (const subtype of subtypes) {
        addToCurve(bySubtypeMap, subtype, cmc, qty);
      }
    }

    addToCurve(byRarityMap, normalizeRarity(card.rarity), cmc, qty);
  }

  return {
    byColor: seriesFromMap(
      byColorMap,
      COLOR_KEYS,
      (key) => COLOR_SPELL_LABEL[key as ManaColorKey],
      (key) => key as ManaColorKey,
    ),
    byType: seriesFromMap(byTypeMap, TYPE_KEYS, (key) =>
      typeGroupLabel(key as DeckCardTypeGroupId),
    ),
    byPermanence: seriesFromMap(
      byPermanenceMap,
      ["permanent", "nonpermanent"],
      (key) => (key === "permanent" ? "Permanents" : "Non-permanents"),
    ),
    byRole: seriesFromMap(byRoleMap, ROLE_KEYS, (key) =>
      key === "uncategorized" ? "Uncategorized" : facetLabel(key),
    ),
    bySubtype: buildSubtypeSeries(bySubtypeMap, subtypeNone),
    byRarity: seriesFromMap(byRarityMap, RARITY_KEYS, rarityLabel),
  };
}

export function seriesForMode(
  breakdowns: DeckCurveBreakdowns,
  mode: CurveBreakdownMode,
): CurveSeries[] {
  switch (mode) {
    case "color":
      return breakdowns.byColor;
    case "type":
      return breakdowns.byType;
    case "permanence":
      return breakdowns.byPermanence;
    case "role":
      return breakdowns.byRole;
    case "subtype":
      return breakdowns.bySubtype;
    case "rarity":
      return breakdowns.byRarity;
  }
}
