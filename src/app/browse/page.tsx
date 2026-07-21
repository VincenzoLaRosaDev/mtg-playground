import { Suspense } from "react";

import { BrowseHubClient } from "@/app/browse/browse-hub-client";
import { getBrowseHubDefaults } from "@/lib/browse/browse-defaults";
import { getCachedDefaultBrowseHub } from "@/lib/browse/browse-cache";
import { listPresentClassificationFacets } from "@/lib/classification/present-facets";
import { prisma } from "@/lib/db";

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

export default async function BrowsePage({ searchParams }: BrowsePageProps) {
  const params = await searchParams;
  const commandersOnly = parseCommandersOnly(params);
  const { toolbar, requestKey } = getBrowseHubDefaults({ commandersOnly });
  const [initialData, facets] = await Promise.all([
    getCachedDefaultBrowseHub(commandersOnly),
    listPresentClassificationFacets(prisma),
  ]);

  return (
    <Suspense fallback={<p className="p-6 text-sm text-muted-foreground">Loading browse…</p>}>
      <BrowseHubClient
        initialData={initialData}
        initialToolbar={toolbar}
        initialRequestKey={requestKey}
        presentRoles={facets.roles}
        presentThemes={facets.themes}
      />
    </Suspense>
  );
}
