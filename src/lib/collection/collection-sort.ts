import type { BrowseOrder } from "@/lib/browse/types";
import { parseBrowseOrder } from "@/lib/browse/params";
import type { PrintingFinish } from "@/lib/scryfall/card-printing";
import { pickCatalogPriceStrings } from "@/lib/scryfall/card-prices";

export type CollectionSort =
  | "updated"
  | "created"
  | "price"
  | "name"
  | "set"
  | "cmc"
  | "color";

export const COLLECTION_SORT_OPTIONS: { value: CollectionSort; label: string }[] = [
  { value: "updated", label: "Last modified" },
  { value: "created", label: "Last added" },
  { value: "name", label: "Name" },
  { value: "set", label: "Set & collector #" },
  { value: "cmc", label: "CMC" },
  { value: "color", label: "Color & CMC" },
  { value: "price", label: "Price" },
];

export function defaultCollectionSort(): CollectionSort {
  return "updated";
}

export function defaultCollectionOrder(sort: CollectionSort): BrowseOrder {
  if (
    sort === "name" ||
    sort === "set" ||
    sort === "price" ||
    sort === "cmc" ||
    sort === "color"
  ) {
    return "asc";
  }
  return "desc";
}

export function parseCollectionSort(value: string | null | undefined): CollectionSort {
  if (
    value === "updated" ||
    value === "created" ||
    value === "price" ||
    value === "name" ||
    value === "set" ||
    value === "cmc" ||
    value === "color"
  ) {
    return value;
  }
  return defaultCollectionSort();
}

export function parseCollectionSortParams(input: {
  sort?: string | null;
  order?: string | null;
}): { sort: CollectionSort; order: BrowseOrder } {
  const sort = parseCollectionSort(input.sort);
  return {
    sort,
    order: parseBrowseOrder(input.order, defaultCollectionOrder(sort)),
  };
}

/** Finish-aware catalog list price (EUR-first) for collection sort. */
export function parseCollectionListPrice(
  prices: unknown,
  finish: PrintingFinish,
): number | null {
  const picked = pickCatalogPriceStrings(prices);
  const raw =
    finish === "nonfoil" ? picked.regular : (picked.foil ?? picked.regular);
  if (!raw) return null;
  const value = Number.parseFloat(raw);
  return Number.isFinite(value) ? value : null;
}

export function collectorNumberSortKey(collectorNumber: string): string {
  // Pad leading digits so "2" < "10" while keeping letter suffixes (e.g. 12a).
  return collectorNumber.replace(/^(\d+)/, (digits) => digits.padStart(6, "0"));
}

/** Sorts applied in memory after fetch (price finish-aware; set CN pad; cmc/color via Card). */
export function collectionSortNeedsInMemory(sort: CollectionSort): boolean {
  return sort === "price" || sort === "set" || sort === "cmc" || sort === "color";
}
