import { Suspense } from "react";

import { SetsBrowseClient } from "@/app/sets/sets-browse-client";
import {
  BrowseToolbarSkeleton,
  PageListMetaSkeleton,
  SetBrowseGridSkeleton,
} from "@/components/discovery/loading-skeletons";
import { PageShell } from "@/components/layout/page-shell";
import { listDistinctSetTypes, querySetsBrowse } from "@/lib/browse/sets";
import { getSetsBrowseDefaults } from "@/lib/browse/sets-defaults";
import {
  buildSetTypeFilterOptions,
  type SetBrowseItem,
} from "@/lib/browse/sets-shared";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

async function SetsPageContent() {
  const { toolbar, requestKey, queryParams } = getSetsBrowseDefaults();
  const [result, setTypes] = await Promise.all([
    querySetsBrowse(prisma, queryParams),
    listDistinctSetTypes(prisma),
  ]);

  const initialData = {
    items: result.items.map(
      (item): SetBrowseItem => ({
        ...item,
        releasedAt: item.releasedAt?.toISOString() ?? null,
      }),
    ),
    total: result.total,
    nextCursor: result.nextCursor,
  };

  return (
    <SetsBrowseClient
      initialData={initialData}
      initialToolbar={toolbar}
      initialRequestKey={requestKey}
      typeOptions={buildSetTypeFilterOptions(setTypes)}
    />
  );
}

function SetsPageFallback() {
  return (
    <PageShell
      title="Sets"
      description="Browse Magic sets by release date, type, and indexed card coverage."
      toolbar={<BrowseToolbarSkeleton variant="setDetail" />}
    >
      <PageListMetaSkeleton />
      <div className="mt-6">
        <SetBrowseGridSkeleton />
      </div>
    </PageShell>
  );
}

export default function SetsPage() {
  return (
    <Suspense fallback={<SetsPageFallback />}>
      <SetsPageContent />
    </Suspense>
  );
}
