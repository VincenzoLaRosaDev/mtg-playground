import {
  type AllCardSort,
  type CardBrowseSort,
  defaultOrderForTab,
  parsePriceBand,
} from "@/lib/browse/cards-shared";
import type { CardBrowseFilters } from "@/lib/browse/cards-filters";
import {
  parseBrowseColorsParam,
  parseBrowseLimit,
  parseBrowseOptionalNumber,
  parseBrowseOrder,
} from "@/lib/browse/params";
import { parseRaritiesParam } from "@/lib/browse/rarity-filter";
import type { BrowseOrder } from "@/lib/browse/types";
import { parseCatalogListPrice } from "@/lib/scryfall/card-prices";

export type BrowseEntity = "cards" | "commanders";

export type CardBrowseParams = {
  limit?: number;
  cursor?: string | null;
  sort?: CardBrowseSort;
  order?: BrowseOrder;
  filters?: CardBrowseFilters;
  entity?: BrowseEntity;
};

export type CardBrowseCursor = {
  sort: CardBrowseSort;
  order: BrowseOrder;
  id?: string;
  name: string;
  cmc?: number;
  popularityRank?: number | null;
  /** EUR-first list price (legacy cursors may still send `usdPrice`). */
  listPrice?: number | null;
  usdPrice?: number | null;
};

function parseCardBrowseSort(value: string | null | undefined): CardBrowseSort {
  if (value === "name" || value === "cmc" || value === "price" || value === "popularity") {
    return value;
  }
  return "popularity";
}

export function parseBrowseEntity(value: string | null | undefined): BrowseEntity {
  return value === "commanders" ? "commanders" : "cards";
}

export function parseCardBrowseParams(searchParams: URLSearchParams): CardBrowseParams {
  const sort = parseCardBrowseSort(searchParams.get("sort"));
  const entity = parseBrowseEntity(searchParams.get("entity"));
  const role = searchParams.get("role")?.trim() || undefined;
  const theme = searchParams.get("theme")?.trim() || undefined;

  return {
    limit: parseBrowseLimit(searchParams.get("limit")),
    cursor: searchParams.get("cursor"),
    sort,
    order: parseBrowseOrder(searchParams.get("order"), defaultOrderForTab(sort)),
    entity,
    filters: {
      query: searchParams.get("q")?.trim() || undefined,
      colors: parseBrowseColorsParam(searchParams.get("color")),
      cmcMin: parseBrowseOptionalNumber(searchParams.get("cmc_min")),
      cmcMax: parseBrowseOptionalNumber(searchParams.get("cmc_max")),
      typeContains: searchParams.get("type")?.trim() || undefined,
      commanderLegal: searchParams.get("commander") === "legal",
      commandersOnly:
        entity === "commanders" || searchParams.get("commanders_only") === "true",
      requireSlug: entity === "commanders" || searchParams.get("require_slug") === "true",
      rarities: parseRaritiesParam(searchParams.get("rarity")),
      role,
      theme,
      gameChanger: searchParams.get("gc") === "1" || searchParams.get("game_changer") === "true",
      reserved: searchParams.get("reserved") === "1" || searchParams.get("reserved") === "true",
      priceBand: parsePriceBand(searchParams.get("price_band") ?? searchParams.get("budget")),
    },
  };
}

export function allCursorPayload(
  row: {
    id: string;
    name: string;
    cmc: number;
    popularityRank?: number | null;
    prices?: unknown;
    listPrice?: number | null;
  },
  sort: AllCardSort,
  order: BrowseOrder,
): CardBrowseCursor {
  return {
    sort,
    order,
    id: row.id,
    name: row.name,
    cmc: row.cmc,
    popularityRank: row.popularityRank ?? null,
    listPrice: row.listPrice ?? parseCatalogListPrice(row.prices),
  };
}
