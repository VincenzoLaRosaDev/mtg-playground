import {
  defaultCatalogOrder,
  defaultCatalogSort,
  type AllCardSort,
} from "@/lib/browse/cards-shared";
import type { CardBrowseParams } from "@/lib/browse/cards-params";
import type { BrowseOrder } from "@/lib/browse/types";
import type { ScryfallBrowseFormat } from "@/lib/formats/scryfall-formats";

export type BrowseHubToolbarSnapshot = {
  query: string;
  sort: AllCardSort;
  order: BrowseOrder;
  colors: string[];
  rarities: string[];
  cmcMin: string;
  cmcMax: string;
  typeContains: string;
  /** Scryfall format legality (`legalities[format] === "legal"`). */
  format: ScryfallBrowseFormat | "";
  /** `isCommander` filter — legal legendary commanders only. */
  commandersOnly: boolean;
  role: string;
  theme: string;
  gameChanger: boolean;
  reserved: boolean;
};

export type BrowseHubDefaults = {
  toolbar: BrowseHubToolbarSnapshot;
  requestKey: string;
  queryParams: CardBrowseParams;
};

export function getBrowseHubDefaults(options?: {
  commandersOnly?: boolean;
}): BrowseHubDefaults {
  const commandersOnly = options?.commandersOnly ?? false;
  const sort: AllCardSort = commandersOnly ? "name" : defaultCatalogSort();
  const toolbar: BrowseHubToolbarSnapshot = {
    query: "",
    sort,
    order: defaultCatalogOrder(sort),
    colors: [],
    rarities: [],
    cmcMin: "",
    cmcMax: "",
    typeContains: "",
    format: "",
    commandersOnly,
    role: "",
    theme: "",
    gameChanger: false,
    reserved: false,
  };

  return {
    toolbar,
    requestKey: JSON.stringify(toolbar),
    queryParams: {
      sort: toolbar.sort,
      order: toolbar.order,
      entity: "cards",
      filters: {
        commandersOnly,
        requireSlug: commandersOnly,
      },
    },
  };
}
