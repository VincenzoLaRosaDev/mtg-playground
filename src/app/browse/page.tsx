import { Suspense } from "react";

import { BrowseHubClient } from "@/app/browse/browse-hub-client";
import { getBrowseHubDefaults } from "@/lib/browse/browse-defaults";
import { getCachedDefaultBrowseHub } from "@/lib/browse/browse-cache";
import type { BrowseEntity } from "@/lib/browse/cards-params";

export const dynamic = "force-dynamic";

type BrowsePageProps = {
  searchParams: Promise<{ entity?: string }>;
};

function parseEntity(value: string | undefined): BrowseEntity {
  return value === "commanders" ? "commanders" : "cards";
}

export default async function BrowsePage({ searchParams }: BrowsePageProps) {
  const params = await searchParams;
  const entity = parseEntity(params.entity);
  const { toolbar, requestKey } = getBrowseHubDefaults(entity);
  const initialData = await getCachedDefaultBrowseHub(entity);

  return (
    <Suspense fallback={<p className="p-6 text-sm text-muted-foreground">Loading browse…</p>}>
      <BrowseHubClient
        initialData={initialData}
        initialToolbar={toolbar}
        initialRequestKey={requestKey}
      />
    </Suspense>
  );
}
