import {
  defaultCatalogOrder,
  defaultCatalogSort,
  type AllCardSort,
} from "@/lib/browse/cards-shared";
import type { CardBrowseParams } from "@/lib/browse/cards-params";
import type { BrowseOrder } from "@/lib/browse/types";
import type { ScryfallBrowseFormat } from "@/lib/formats/scryfall-formats";

export type CardsBrowseToolbarSnapshot = {
  query: string;
  sort: AllCardSort;
  order: BrowseOrder;
  colors: string[];
  rarities: string[];
  cmcMin: string;
  cmcMax: string;
  typeContains: string;
  format: ScryfallBrowseFormat | "";
};

export type CardsBrowseDefaults = {
  toolbar: CardsBrowseToolbarSnapshot;
  requestKey: string;
  queryParams: CardBrowseParams;
};

/** Default cards browse state — catalog Scryfall, shared by SSR and client hydrate. */
export function getCardsBrowseDefaults(): CardsBrowseDefaults {
  const sort = defaultCatalogSort();
  const toolbar: CardsBrowseToolbarSnapshot = {
    query: "",
    sort,
    order: defaultCatalogOrder(sort),
    colors: [],
    rarities: [],
    cmcMin: "",
    cmcMax: "",
    typeContains: "",
    format: "",
  };

  return {
    toolbar,
    requestKey: JSON.stringify(toolbar),
    queryParams: {
      sort: toolbar.sort,
      order: toolbar.order,
      entity: "cards",
      filters: {},
    },
  };
}
