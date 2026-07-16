import {
  type AllCardSort,
  type CardBrowseSort,
  type CardBrowseTab,
  type PopularCardSort,
  defaultOrderForTab,
} from "@/lib/browse/cards-shared";
import type { CardBrowseFilters } from "@/lib/browse/cards-filters";
import { parseBrowseColorsParam, parseBrowseLimit, parseBrowseOptionalNumber, parseBrowseOrder } from "@/lib/browse/params";
import { parseRaritiesParam } from "@/lib/browse/rarity-filter";
import type { BrowseOrder } from "@/lib/browse/types";
import {
  parseCardTopWindowParam,
  type EdhrecCardTopWindowParam,
} from "@/lib/edhrec/top-window";

export type CardBrowseParams = {
  tab?: CardBrowseTab;
  window?: EdhrecCardTopWindowParam;
  limit?: number;
  cursor?: string | null;
  sort?: CardBrowseSort;
  order?: BrowseOrder;
  filters?: CardBrowseFilters;
};

export type CardBrowseCursor = {
  tab: CardBrowseTab;
  window?: EdhrecCardTopWindowParam;
  sort: CardBrowseSort;
  order: BrowseOrder;
  slug?: string;
  id?: string;
  name: string;
  rank?: number | null;
  inclusion?: number | null;
  numDecks?: number | null;
  salt?: number | null;
  cmc?: number;
};

function parseCardBrowseTab(value: string | null | undefined): CardBrowseTab {
  return value === "all" ? "all" : "popular";
}

function defaultOrderForCardBrowseTab(tab: CardBrowseTab, sort: CardBrowseSort): "asc" | "desc" {
  if (tab === "all") {
    if (sort === "name" || sort === "cmc") return "asc";
    return "desc";
  }

  return defaultOrderForTab(sort);
}

function parseCardBrowseSort(tab: CardBrowseTab, value: string | null | undefined): CardBrowseSort {
  if (tab === "popular") {
    if (
      value === "rank" ||
      value === "numDecks" ||
      value === "name" ||
      value === "salt" ||
      value === "inclusion"
    ) {
      return value;
    }
    return "rank";
  }

  return value === "cmc" ? "cmc" : "name";
}

export function parseCardBrowseParams(searchParams: URLSearchParams): CardBrowseParams {
  const tab = parseCardBrowseTab(searchParams.get("tab"));
  const window = parseCardTopWindowParam(searchParams.get("window"));
  const sort = parseCardBrowseSort(tab, searchParams.get("sort"));
  const hasEdhrecParam = searchParams.get("has_edhrec");

  return {
    tab,
    window,
    limit: parseBrowseLimit(searchParams.get("limit")),
    cursor: searchParams.get("cursor"),
    sort,
    order: parseBrowseOrder(searchParams.get("order"), defaultOrderForCardBrowseTab(tab, sort)),
    filters: {
      query: searchParams.get("q")?.trim() || undefined,
      colors: parseBrowseColorsParam(searchParams.get("color")),
      cmcMin: parseBrowseOptionalNumber(searchParams.get("cmc_min")),
      cmcMax: parseBrowseOptionalNumber(searchParams.get("cmc_max")),
      typeContains: searchParams.get("type")?.trim() || undefined,
      commanderLegal: searchParams.get("commander") === "legal",
      commandersOnly: searchParams.get("commanders_only") === "true",
      rarities: parseRaritiesParam(searchParams.get("rarity")),
      hasEdhrec:
        hasEdhrecParam === "true" ? true : hasEdhrecParam === "false" ? false : undefined,
    },
  };
}

export function popularCursorPayload(
  row: {
    name: string;
    rank: number | null;
    inclusion: number | null;
    numDecks: number | null;
    salt: number | null;
  },
  slug: string,
  sort: PopularCardSort,
  order: BrowseOrder,
  window: EdhrecCardTopWindowParam,
): CardBrowseCursor {
  return {
    tab: "popular",
    window,
    sort,
    order,
    slug,
    name: row.name,
    rank: row.rank,
    inclusion: row.inclusion,
    numDecks: row.numDecks,
    salt: row.salt,
  };
}

export function allCursorPayload(
  row: { id: string; name: string; cmc: number },
  sort: AllCardSort,
  order: BrowseOrder,
): CardBrowseCursor {
  return {
    tab: "all",
    sort,
    order,
    id: row.id,
    name: row.name,
    cmc: row.cmc,
  };
}
