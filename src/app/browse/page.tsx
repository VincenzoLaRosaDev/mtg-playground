import { Suspense } from "react";

import { BrowseHubClient } from "@/app/browse/browse-hub-client";
import { BrowseHubFallback } from "@/components/discovery/browse-hub-fallback";
import { getBrowseHubDefaults } from "@/lib/browse/browse-defaults";
import {
  getCachedDefaultBrowseHub,
  getCachedPresentClassificationFacets,
} from "@/lib/browse/browse-cache";

export const dynamic = "force-dynamic";

type BrowsePageProps = {
  searchParams: Promise<{
    entity?: string;
    commanders_only?: string;
  }>;
};

function parseCommandersOnly(params: {
  entity?: string;
  commanders_only?: string;
}): boolean {
  return params.commanders_only === "true" || params.entity === "commanders";
}

async function BrowsePageContent({ searchParams }: BrowsePageProps) {
  const params = await searchParams;
  const commandersOnly = parseCommandersOnly(params);
  const { toolbar, requestKey } = getBrowseHubDefaults({ commandersOnly });
  const [initialData, facets] = await Promise.all([
    getCachedDefaultBrowseHub(commandersOnly),
    getCachedPresentClassificationFacets(),
  ]);

  return (
    <BrowseHubClient
      initialData={initialData}
      initialToolbar={toolbar}
      initialRequestKey={requestKey}
      presentRoles={facets.roles}
      presentThemes={facets.themes}
    />
  );
}

export default function BrowsePage({ searchParams }: BrowsePageProps) {
  return (
    <Suspense fallback={<BrowseHubFallback />}>
      <BrowsePageContent searchParams={searchParams} />
    </Suspense>
  );
}
