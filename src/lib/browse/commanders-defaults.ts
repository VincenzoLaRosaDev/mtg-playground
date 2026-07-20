import {
  defaultOrderForCommanderTab,
  defaultSortForCommanderTab,
  type CommanderBrowseSort,
} from "@/lib/browse/commanders-shared";
import type { CommanderBrowseParams } from "@/lib/browse/commanders";
import type { BrowseOrder } from "@/lib/browse/types";

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
  toolbar: CommandersBrowseToolbarSnapshot;
  requestKey: string;
  queryParams: CommanderBrowseParams;
};

export function getCommandersBrowseDefaults(): CommandersBrowseDefaults {
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
    toolbar,
    requestKey: JSON.stringify(toolbar),
    queryParams: {
      sort: toolbar.sort,
      order: toolbar.order,
      filters: {},
    },
  };
}
