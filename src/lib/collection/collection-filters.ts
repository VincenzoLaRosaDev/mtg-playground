import { colorsToParam, parseColorsFromParam } from "@/lib/browse/color-identity-filter";
import {
  parseBrowseOptionalNumber,
  parseBrowseOrder,
} from "@/lib/browse/params";
import { parseRaritiesParam, raritiesToParam } from "@/lib/browse/rarity-filter";
import type { BrowseOrder } from "@/lib/browse/types";
import {
  defaultCollectionOrder,
  defaultCollectionSort,
  parseCollectionSort,
  type CollectionSort,
} from "@/lib/collection/collection-sort";
import {
  getBrowseFormatFilterOptions,
  resolveFormatFromSearchParams,
  type ScryfallBrowseFormat,
} from "@/lib/formats/scryfall-formats";
import { CARD_TEXT_SEARCH_MIN_LENGTH } from "@/lib/search/card-text-search";
import {
  parsePrintingFinish,
  type PrintingFinish,
} from "@/lib/scryfall/card-printing";

/** Scope tabs on `/collection` — kept here so client toolbar never imports Prisma modules. */
export type CollectionFilter = "all" | "owned" | "wantlist";

export const COLLECTION_FINISH_OPTIONS: {
  value: PrintingFinish;
  label: string;
}[] = [
  { value: "nonfoil", label: "Nonfoil" },
  { value: "foil", label: "Foil" },
  { value: "etched", label: "Etched" },
];

export type CollectionFacets = {
  query?: string;
  colors?: string[];
  rarities?: string[];
  typeContains?: string;
  cmcMin?: number;
  cmcMax?: number;
  format?: ScryfallBrowseFormat;
  finishes?: PrintingFinish[];
  /** Set code (exact) or set name (contains). */
  setQuery?: string;
};

export type CollectionListQuery = CollectionFacets & {
  filter: CollectionFilter;
  sort: CollectionSort;
  order: BrowseOrder;
};

export function parseCollectionFinishesParam(
  value: string | null | undefined,
): PrintingFinish[] {
  if (!value?.trim()) return [];
  const finishes = value
    .split(",")
    .map((entry) => parsePrintingFinish(entry.trim().toLowerCase()))
    .filter((finish): finish is PrintingFinish => finish != null);
  return [...new Set(finishes)];
}

export function finishesToParam(finishes: PrintingFinish[]): string | undefined {
  return finishes.length > 0 ? finishes.join(",") : undefined;
}

export function parseCollectionListQuery(input: {
  filter?: string | null;
  sort?: string | null;
  order?: string | null;
  q?: string | null;
  color?: string | null;
  rarity?: string | null;
  type?: string | null;
  cmc_min?: string | null;
  cmc_max?: string | null;
  format?: string | null;
  commander?: string | null;
  finish?: string | null;
  set?: string | null;
}): CollectionListQuery {
  const sort = parseCollectionSort(input.sort);
  const colors = parseColorsFromParam(input.color ?? undefined);
  const rarities = parseRaritiesParam(input.rarity);
  const finishes = parseCollectionFinishesParam(input.finish);

  return {
    filter:
      input.filter === "owned" || input.filter === "wantlist" ? input.filter : "all",
    sort,
    order: parseBrowseOrder(input.order, defaultCollectionOrder(sort)),
    query: input.q?.trim() || undefined,
    colors: colors.length > 0 ? colors : undefined,
    rarities: rarities.length > 0 ? rarities : undefined,
    typeContains: input.type?.trim() || undefined,
    cmcMin: parseBrowseOptionalNumber(input.cmc_min),
    cmcMax: parseBrowseOptionalNumber(input.cmc_max),
    format: resolveFormatFromSearchParams({
      format: input.format,
      commander: input.commander,
    }),
    finishes: finishes.length > 0 ? finishes : undefined,
    setQuery: input.set?.trim() || undefined,
  };
}

export function hasActiveCollectionFacets(facets: CollectionFacets): boolean {
  return Boolean(
    facets.query ||
      facets.colors?.length ||
      facets.rarities?.length ||
      facets.typeContains ||
      facets.cmcMin != null ||
      facets.cmcMax != null ||
      facets.format ||
      facets.finishes?.length ||
      facets.setQuery,
  );
}

export function buildCollectionSearchParams(query: CollectionListQuery): URLSearchParams {
  const params = new URLSearchParams();

  if (query.filter !== "all") params.set("filter", query.filter);

  if (query.sort !== defaultCollectionSort()) {
    params.set("sort", query.sort);
  }
  if (query.order !== defaultCollectionOrder(query.sort)) {
    params.set("order", query.order);
  }

  if (query.query && query.query.length >= CARD_TEXT_SEARCH_MIN_LENGTH) {
    params.set("q", query.query);
  }

  const colorParam = colorsToParam(query.colors ?? []);
  if (colorParam) params.set("color", colorParam);

  const rarityParam = raritiesToParam(query.rarities ?? []);
  if (rarityParam) params.set("rarity", rarityParam);

  if (query.typeContains) params.set("type", query.typeContains);
  if (query.cmcMin != null) params.set("cmc_min", String(query.cmcMin));
  if (query.cmcMax != null) params.set("cmc_max", String(query.cmcMax));
  if (query.format) params.set("format", query.format);

  const finishParam = finishesToParam(query.finishes ?? []);
  if (finishParam) params.set("finish", finishParam);

  if (query.setQuery) params.set("set", query.setQuery);

  return params;
}

export function collectionFormatFilterOptions() {
  return getBrowseFormatFilterOptions();
}
