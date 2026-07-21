import {
  FUNCTIONAL_ROLES,
  SYNERGY_THEMES,
} from "@/lib/classification/types";
import { INCLUSION_RANK_SORT_LABEL } from "@/lib/display/inclusion-rank";
import { parseCatalogListPrice } from "@/lib/scryfall/card-prices";
import type { CardFaceImage } from "@/lib/scryfall/faces";

export type AllCardSort = "popularity" | "color" | "name" | "cmc" | "price";

export type CardBrowseSort = AllCardSort;

export type CardBrowseItem = {
  id: string;
  name: string;
  slug: string | null;
  typeLine: string;
  cmc: number;
  colorIdentity: string[];
  imageUri: string | null;
  faces: CardFaceImage[];
  isCommander: boolean;
  /** Scryfall prices JSON (EUR via Cardmarket; USD via TCGPlayer). */
  prices: unknown;
  popularityRank: number | null;
  frictionScore: number;
  isGameChanger: boolean;
  isReserved: boolean;
  /** EUR-first list price for sort (USD fallback). */
  listPrice: number | null;
  /** Denormalized Arena-like color order key (browse cursor / sort). */
  colorSort?: number;
};

export function getCatalogBrowseSortOptions(): { value: AllCardSort; label: string }[] {
  return [
    { value: "popularity", label: INCLUSION_RANK_SORT_LABEL },
    { value: "color", label: "Color & CMC" },
    { value: "name", label: "Name" },
    { value: "cmc", label: "CMC" },
    { value: "price", label: "Price" },
  ];
}

export function defaultCatalogSort(): AllCardSort {
  return "popularity";
}

/** Inclusion for Any/Commander format; Color & CMC for other formats. */
export function defaultCatalogSortForFormat(
  format: string | null | undefined,
): AllCardSort {
  if (!format || format === "commander") {
    return "popularity";
  }
  return "color";
}

export function defaultCatalogOrder(sort: AllCardSort): "asc" | "desc" {
  if (sort === "name" || sort === "cmc" || sort === "price" || sort === "color") {
    return "asc";
  }
  // Inclusion rank: lower = more often included in Commander decks
  return "asc";
}

/** @deprecated Use getCatalogBrowseSortOptions — kept for cards browse toolbar reuse. */
export function getCardBrowseSortOptions(): { value: CardBrowseSort; label: string }[] {
  return getCatalogBrowseSortOptions();
}

export function defaultSortForTab(): CardBrowseSort {
  return defaultCatalogSort();
}

export function defaultOrderForTab(sort: CardBrowseSort): "asc" | "desc" {
  return defaultCatalogOrder(sort);
}

/** @deprecated Use parseCatalogListPrice — EUR-first catalog price. */
export function parseUsdPrice(prices: unknown): number | null {
  return parseCatalogListPrice(prices);
}

/** Client-safe facet options (no Prisma imports). */
export const ROLE_FILTER_OPTIONS = FUNCTIONAL_ROLES.map((value) => ({
  value,
  label: value.replaceAll("_", " "),
}));

export const THEME_FILTER_OPTIONS = SYNERGY_THEMES.map((value) => ({
  value,
  label: value.replaceAll("_", " "),
}));

export type ClassificationFilterOption = { value: string; label: string };

/**
 * Hide-empty Role options: keep enum order; drop values with no classified cards.
 * Falls back to the full enum when nothing is present (pre-sync). Always keeps `selected`.
 */
export function buildRoleFilterOptions(
  present: readonly string[],
  selected = "",
): ClassificationFilterOption[] {
  if (present.length === 0) {
    return ROLE_FILTER_OPTIONS;
  }
  const keep = new Set(present);
  if (selected) keep.add(selected);
  return FUNCTIONAL_ROLES.filter((role) => keep.has(role)).map((value) => ({
    value,
    label: value.replaceAll("_", " "),
  }));
}

/** Same hide-empty contract as roles, for SynergyTheme. */
export function buildThemeFilterOptions(
  present: readonly string[],
  selected = "",
): ClassificationFilterOption[] {
  if (present.length === 0) {
    return THEME_FILTER_OPTIONS;
  }
  const keep = new Set(present);
  if (selected) keep.add(selected);
  return SYNERGY_THEMES.filter((theme) => keep.has(theme)).map((value) => ({
    value,
    label: value.replaceAll("_", " "),
  }));
}
