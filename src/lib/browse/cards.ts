import type { PrismaClient } from "@/generated/prisma/client";

import { queryAllCardsBrowse } from "@/lib/browse/cards-catalog";
import type { CardBrowseParams } from "@/lib/browse/cards-params";
import { queryPopularCardsBrowse } from "@/lib/browse/cards-popular";
import type { CardBrowseItem } from "@/lib/browse/cards-shared";
import type { BrowseListResponse } from "@/lib/browse/types";

export type {
  AllCardSort,
  CardBrowseItem,
  CardBrowseSort,
  CardBrowseTab,
  PopularCardSort,
} from "@/lib/browse/cards-shared";
export { getCardBrowseSortOptions } from "@/lib/browse/cards-shared";

export type { CardBrowseFilters } from "@/lib/browse/cards-filters";
export { buildCatalogCardWhere } from "@/lib/browse/cards-filters";

export type { CardBrowseParams } from "@/lib/browse/cards-params";
export { parseCardBrowseParams } from "@/lib/browse/cards-params";

export async function queryCardsBrowse(
  prisma: PrismaClient,
  params: CardBrowseParams,
): Promise<BrowseListResponse<CardBrowseItem>> {
  const tab = params.tab ?? "popular";

  if (tab === "all") {
    return queryAllCardsBrowse(prisma, params);
  }

  return queryPopularCardsBrowse(prisma, params);
}
