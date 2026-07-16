import {
  defaultCatalogOrder,
  defaultCatalogSort,
  type AllCardSort,
} from "@/lib/browse/cards-shared";
import type { CardBrowseParams } from "@/lib/browse/cards-params";
import type { BrowseOrder } from "@/lib/browse/types";

export type CatalogBrowseToolbarSnapshot = {
  query: string;
  sort: AllCardSort;
  order: BrowseOrder;
  colors: string[];
  rarities: string[];
  cmcMin: string;
  cmcMax: string;
  typeContains: string;
  commanderLegal: boolean;
  commandersOnly: boolean;
};

export type CatalogBrowseDefaults = {
  toolbar: CatalogBrowseToolbarSnapshot;
  requestKey: string;
  queryParams: CardBrowseParams;
};

export function getCatalogBrowseDefaults(): CatalogBrowseDefaults {
  const sort = defaultCatalogSort();
  const toolbar: CatalogBrowseToolbarSnapshot = {
    query: "",
    sort,
    order: defaultCatalogOrder(sort),
    colors: [],
    rarities: [],
    cmcMin: "",
    cmcMax: "",
    typeContains: "",
    commanderLegal: false,
    commandersOnly: false,
  };

  return {
    toolbar,
    requestKey: JSON.stringify(toolbar),
    queryParams: {
      tab: "all",
      sort: toolbar.sort,
      order: toolbar.order,
      filters: {},
    },
  };
}
