import {
  defaultCatalogOrder,
  defaultCatalogSort,
  type AllCardSort,
  type PriceBand,
} from "@/lib/browse/cards-shared";
import type { BrowseEntity, CardBrowseParams } from "@/lib/browse/cards-params";
import type { BrowseOrder } from "@/lib/browse/types";

export type BrowseHubToolbarSnapshot = {
  entity: BrowseEntity;
  query: string;
  sort: AllCardSort;
  order: BrowseOrder;
  colors: string[];
  rarities: string[];
  cmcMin: string;
  cmcMax: string;
  typeContains: string;
  commanderLegal: boolean;
  role: string;
  theme: string;
  gameChanger: boolean;
  reserved: boolean;
  priceBand: PriceBand | "";
};

export type BrowseHubDefaults = {
  toolbar: BrowseHubToolbarSnapshot;
  requestKey: string;
  queryParams: CardBrowseParams;
};

export function getBrowseHubDefaults(entity: BrowseEntity = "cards"): BrowseHubDefaults {
  // Commanders: name-first (not inclusion-rank “meta”). Cards: inclusion default.
  const sort: AllCardSort = entity === "commanders" ? "name" : defaultCatalogSort();
  const toolbar: BrowseHubToolbarSnapshot = {
    entity,
    query: "",
    sort,
    order: defaultCatalogOrder(sort),
    colors: [],
    rarities: [],
    cmcMin: "",
    cmcMax: "",
    typeContains: "",
    commanderLegal: false,
    role: "",
    theme: "",
    gameChanger: false,
    reserved: false,
    priceBand: "",
  };

  return {
    toolbar,
    requestKey: JSON.stringify(toolbar),
    queryParams: {
      sort: toolbar.sort,
      order: toolbar.order,
      entity,
      filters: {
        commandersOnly: entity === "commanders",
        requireSlug: entity === "commanders",
      },
    },
  };
}
