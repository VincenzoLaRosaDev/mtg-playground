import {
  defaultOrderForCommanderTab,
  defaultSortForCommanderTab,
  type CommanderBrowseSort,
} from "@/lib/browse/commanders-shared";
import type { CommanderBrowseParams } from "@/lib/browse/commanders";
import type { BrowseOrder } from "@/lib/browse/types";
import { DEFAULT_EDHREC_TOP_WINDOW, type EdhrecTopWindowParam } from "@/lib/edhrec/top-window";

export type CommandersBrowseToolbarSnapshot = {
  query: string;
  sort: CommanderBrowseSort;
  order: BrowseOrder;
  colors: string[];
  cmcMin: string;
  cmcMax: string;
  typeContains: string;
};

export type CommandersBrowseDefaults = {
  window: EdhrecTopWindowParam;
  toolbar: CommandersBrowseToolbarSnapshot;
  requestKey: string;
  queryParams: CommanderBrowseParams;
};

export function getCommandersBrowseDefaults(): CommandersBrowseDefaults {
  const window = DEFAULT_EDHREC_TOP_WINDOW;
  const sort = defaultSortForCommanderTab();
  const toolbar: CommandersBrowseToolbarSnapshot = {
    query: "",
    sort,
    order: defaultOrderForCommanderTab(sort),
    colors: [],
    cmcMin: "",
    cmcMax: "",
    typeContains: "",
  };

  return {
    window,
    toolbar,
    requestKey: JSON.stringify({ window, toolbar }),
    queryParams: {
      window,
      sort: toolbar.sort,
      order: toolbar.order,
      filters: {},
    },
  };
}
