import type { PrismaClient } from "@/generated/prisma/client";

import { queryAllCardsBrowse } from "@/lib/browse/cards-catalog";
import type { CardBrowseParams } from "@/lib/browse/cards-params";
import type { CardBrowseItem } from "@/lib/browse/cards-shared";
import type { BrowseListResponse } from "@/lib/browse/types";

export type {
  AllCardSort,
  CardBrowseItem,
  CardBrowseSort,
} from "@/lib/browse/cards-shared";
export { getCardBrowseSortOptions, getCatalogBrowseSortOptions } from "@/lib/browse/cards-shared";

export type { CardBrowseFilters } from "@/lib/browse/cards-filters";
export { buildCatalogCardWhere } from "@/lib/browse/cards-filters";

export type { CardBrowseParams } from "@/lib/browse/cards-params";
export { parseCardBrowseParams } from "@/lib/browse/cards-params";

export async function queryCardsBrowse(
  prisma: PrismaClient,
  params: CardBrowseParams,
): Promise<BrowseListResponse<CardBrowseItem>> {
  return queryAllCardsBrowse(prisma, params);
}
