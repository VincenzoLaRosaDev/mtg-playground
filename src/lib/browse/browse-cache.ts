import { unstable_cache } from "next/cache";

import { getBrowseHubDefaults } from "@/lib/browse/browse-defaults";
import { queryCardsBrowse } from "@/lib/browse/cards";
import { getCardsBrowseDefaults } from "@/lib/browse/cards-defaults";
import { queryCommandersBrowse } from "@/lib/browse/commanders";
import { getCommandersBrowseDefaults } from "@/lib/browse/commanders-defaults";
import { listPresentClassificationFacets } from "@/lib/classification/present-facets";
import { prisma } from "@/lib/db";

export const BROWSE_CARDS_TOP_CACHE_TAG = "browse-cards-top";
export const BROWSE_COMMANDERS_TOP_CACHE_TAG = "browse-commanders-top";
export const BROWSE_HUB_CACHE_TAG = "browse-hub";
export const BROWSE_FACETS_CACHE_TAG = "browse-classification-facets";

const DEFAULT_BROWSE_REVALIDATE_SECONDS = 3600;

export function getCachedDefaultBrowseHub(commandersOnly = false) {
  const { queryParams } = getBrowseHubDefaults({ commandersOnly });

  return unstable_cache(
    () => queryCardsBrowse(prisma, queryParams),
    [`browse-hub-default-${commandersOnly ? "commanders" : "cards"}-v4`],
    {
      revalidate: DEFAULT_BROWSE_REVALIDATE_SECONDS,
      tags: [BROWSE_HUB_CACHE_TAG, BROWSE_CARDS_TOP_CACHE_TAG],
    },
  )();
}

/** SSR hydrate for legacy `/cards` default state. */
export function getCachedDefaultCardsBrowse() {
  const { queryParams } = getCardsBrowseDefaults();

  return unstable_cache(
    () => queryCardsBrowse(prisma, queryParams),
    ["browse-cards-default-v2"],
    {
      revalidate: DEFAULT_BROWSE_REVALIDATE_SECONDS,
      tags: [BROWSE_CARDS_TOP_CACHE_TAG],
    },
  )();
}

/** SSR hydrate for legacy `/commanders` default state. */
export function getCachedDefaultCommandersBrowse() {
  const { queryParams } = getCommandersBrowseDefaults();

  return unstable_cache(
    () => queryCommandersBrowse(prisma, queryParams),
    ["browse-commanders-default-v3"],
    {
      revalidate: DEFAULT_BROWSE_REVALIDATE_SECONDS,
      tags: [BROWSE_COMMANDERS_TOP_CACHE_TAG],
    },
  )();
}

/** Roles/themes present in classifications — cached with hub defaults. */
export function getCachedPresentClassificationFacets() {
  return unstable_cache(
    () => listPresentClassificationFacets(prisma),
    ["browse-classification-facets-v1"],
    {
      revalidate: DEFAULT_BROWSE_REVALIDATE_SECONDS,
      tags: [BROWSE_FACETS_CACHE_TAG, BROWSE_HUB_CACHE_TAG],
    },
  )();
}
