import { SetsBrowseClient } from "@/app/sets/sets-browse-client";
import { listDistinctSetTypes, querySetsBrowse } from "@/lib/browse/sets";
import { getSetsBrowseDefaults } from "@/lib/browse/sets-defaults";
import {
  buildSetTypeFilterOptions,
  type SetBrowseItem,
} from "@/lib/browse/sets-shared";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function SetsPage() {
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
