import {
  FUNCTIONAL_ROLES,
  SYNERGY_THEMES,
} from "@/lib/classification/types";
import { INCLUSION_RANK_SORT_LABEL } from "@/lib/display/inclusion-rank";
import { parseCatalogListPrice } from "@/lib/scryfall/card-prices";
import type { CardFaceImage } from "@/lib/scryfall/faces";

export type AllCardSort = "popularity" | "name" | "cmc" | "price";

export type CardBrowseSort = AllCardSort;

export type PriceBand = "low" | "mid" | "high";

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
};

export function getCatalogBrowseSortOptions(): { value: AllCardSort; label: string }[] {
  return [
    { value: "popularity", label: INCLUSION_RANK_SORT_LABEL },
    { value: "name", label: "Name" },
    { value: "cmc", label: "CMC" },
    { value: "price", label: "Price" },
  ];
}

export function defaultCatalogSort(): AllCardSort {
  return "popularity";
}

export function defaultCatalogOrder(sort: AllCardSort): "asc" | "desc" {
  if (sort === "name" || sort === "cmc" || sort === "price") {
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

export function parsePriceBand(value: string | null | undefined): PriceBand | undefined {
  if (value === "low" || value === "mid" || value === "high") {
    return value;
  }
  return undefined;
}

/** Bands use Scryfall EUR (Cardmarket). Same €1 / €5 cutoffs as the old USD bands. */
export const PRICE_BAND_OPTIONS: { value: PriceBand; label: string }[] = [
  { value: "low", label: "Low (< €1)" },
  { value: "mid", label: "Mid (€1–5)" },
  { value: "high", label: "High (> €5)" },
];

/** Client-safe facet options (no Prisma imports). */
export const ROLE_FILTER_OPTIONS = FUNCTIONAL_ROLES.map((value) => ({
  value,
  label: value.replaceAll("_", " "),
}));

export const THEME_FILTER_OPTIONS = SYNERGY_THEMES.map((value) => ({
  value,
  label: value.replaceAll("_", " "),
}));
