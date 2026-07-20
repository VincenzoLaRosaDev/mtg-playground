import type { PrismaClient } from "@/generated/prisma/client";

import { queryAllCardsBrowse } from "@/lib/browse/cards-catalog";
import type { CardBrowseParams } from "@/lib/browse/cards-params";
import {
  type CommanderBrowseItem,
  type CommanderBrowseSort,
  defaultOrderForCommanderTab,
  defaultSortForCommanderTab,
} from "@/lib/browse/commanders-shared";
import {
  parseBrowseColorsParam,
  parseBrowseLimit,
  parseBrowseOptionalNumber,
  parseBrowseOrder,
} from "@/lib/browse/params";
import type { BrowseListResponse, BrowseOrder } from "@/lib/browse/types";

export type {
  CommanderBrowseItem,
  CommanderBrowseSort,
} from "@/lib/browse/commanders-shared";
export { getCommanderBrowseSortOptions } from "@/lib/browse/commanders-shared";

export type CommanderBrowseFilters = {
  query?: string;
  colors?: string[];
  cmcMin?: number;
  cmcMax?: number;
  typeContains?: string;
};

export type CommanderBrowseParams = {
  limit?: number;
  cursor?: string | null;
  sort?: CommanderBrowseSort;
  order?: BrowseOrder;
  filters?: CommanderBrowseFilters;
};

function parseCommanderBrowseSort(value: string | null | undefined): CommanderBrowseSort {
  if (value === "name" || value === "cmc" || value === "price" || value === "popularity") {
    return value;
  }
  return "popularity";
}

export function parseCommanderBrowseParams(
  searchParams: URLSearchParams,
): CommanderBrowseParams {
  const sort = parseCommanderBrowseSort(searchParams.get("sort"));

  return {
    limit: parseBrowseLimit(searchParams.get("limit")),
    cursor: searchParams.get("cursor"),
    sort,
    order: parseBrowseOrder(searchParams.get("order"), defaultOrderForCommanderTab(sort)),
    filters: {
      query: searchParams.get("q")?.trim() || undefined,
      colors: parseBrowseColorsParam(searchParams.get("color")),
      cmcMin: parseBrowseOptionalNumber(searchParams.get("cmc_min")),
      cmcMax: parseBrowseOptionalNumber(searchParams.get("cmc_max")),
      typeContains: searchParams.get("type")?.trim() || undefined,
    },
  };
}

export async function queryCommandersBrowse(
  prisma: PrismaClient,
  params: CommanderBrowseParams,
): Promise<BrowseListResponse<CommanderBrowseItem>> {
  const sort = params.sort ?? defaultSortForCommanderTab();
  const cardParams: CardBrowseParams = {
    limit: params.limit,
    cursor: params.cursor,
    sort,
    order: params.order,
    filters: {
      ...(params.filters ?? {}),
      commandersOnly: true,
      /** Only commanders with a resolvable detail URL. */
      requireSlug: true,
    },
  };

  const result = await queryAllCardsBrowse(prisma, cardParams);

  return {
    ...result,
    items: result.items.map((card) => ({
      cardId: card.id,
      slug: card.slug!,
      name: card.name,
      cmc: card.cmc,
      colorIdentity: card.colorIdentity,
      imageUri: card.imageUri,
      typeLine: card.typeLine,
      prices: card.prices,
      popularityRank: card.popularityRank,
      frictionScore: card.frictionScore,
    })),
  };
}
