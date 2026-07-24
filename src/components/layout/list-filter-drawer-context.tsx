"use client";

import { createContext, useContext } from "react";

/** True while filter toolbar is teleported into the sticky header drawer. */
export const ListFilterDrawerContext = createContext(false);

export function useListFilterDrawer() {
  return useContext(ListFilterDrawerContext);
}
