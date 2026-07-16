import { SetsBrowseClient } from "@/app/sets/sets-browse-client";
import { querySetsBrowse } from "@/lib/browse/sets";
import { getSetsBrowseDefaults } from "@/lib/browse/sets-defaults";
import type { SetBrowseItem } from "@/lib/browse/sets-shared";
import { prisma } from "@/lib/db";

export default async function SetsPage() {
  const { toolbar, requestKey, queryParams } = getSetsBrowseDefaults();
  const result = await querySetsBrowse(prisma, queryParams);

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
    />
  );
}
