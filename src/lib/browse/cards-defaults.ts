import {
  defaultOrderForTab,
  defaultSortForTab,
  type CardBrowseSort,
} from "@/lib/browse/cards-shared";
import type { CardBrowseParams } from "@/lib/browse/cards-params";
import type { BrowseOrder } from "@/lib/browse/types";
import { DEFAULT_EDHREC_CARD_TOP_WINDOW, type EdhrecCardTopWindowParam } from "@/lib/edhrec/top-window";

/** Plain toolbar snapshot — compatible with CardBrowseToolbarState. */
export type CardsBrowseToolbarSnapshot = {
  query: string;
  sort: CardBrowseSort;
  order: BrowseOrder;
  colors: string[];
  rarities: string[];
  cmcMin: string;
  cmcMax: string;
  typeContains: string;
  commanderLegal: boolean;
};

export type CardsBrowseDefaults = {
  window: EdhrecCardTopWindowParam;
  toolbar: CardsBrowseToolbarSnapshot;
  requestKey: string;
  queryParams: CardBrowseParams;
};

/** Default Top cards browse state — shared by SSR page and client hydrate key. */
export function getCardsBrowseDefaults(): CardsBrowseDefaults {
  const window = DEFAULT_EDHREC_CARD_TOP_WINDOW;
  const sort = defaultSortForTab();
  const toolbar: CardsBrowseToolbarSnapshot = {
    query: "",
    sort,
    order: defaultOrderForTab(sort),
    colors: [],
    rarities: [],
    cmcMin: "",
    cmcMax: "",
    typeContains: "",
    commanderLegal: false,
  };

  return {
    window,
    toolbar,
    requestKey: JSON.stringify({ window, toolbar }),
    queryParams: {
      tab: "popular",
      window,
      sort: toolbar.sort,
      order: toolbar.order,
      filters: {},
    },
  };
}
