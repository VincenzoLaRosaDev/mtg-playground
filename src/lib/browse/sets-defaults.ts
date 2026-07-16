import type { SetBrowseParams } from "@/lib/browse/sets";
import {
  defaultSetBrowseOrder,
  defaultSetBrowseSort,
  type SetBrowseSort,
} from "@/lib/browse/sets-shared";
import type { BrowseOrder } from "@/lib/browse/types";

export type SetsBrowseToolbarSnapshot = {
  query: string;
  sort: SetBrowseSort;
  order: BrowseOrder;
  setType: string;
  digital: "" | "true" | "false";
  indexedOnly: boolean;
};

export type SetsBrowseDefaults = {
  toolbar: SetsBrowseToolbarSnapshot;
  requestKey: string;
  queryParams: SetBrowseParams;
};

export function getSetsBrowseDefaults(): SetsBrowseDefaults {
  const sort = defaultSetBrowseSort();
  const toolbar: SetsBrowseToolbarSnapshot = {
    query: "",
    sort,
    order: defaultSetBrowseOrder(sort),
    setType: "",
    digital: "",
    indexedOnly: false,
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
