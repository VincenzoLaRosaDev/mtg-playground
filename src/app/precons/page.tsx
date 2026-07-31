import type { Metadata } from "next";

import { PreconsBrowseClient } from "@/components/precons/precons-browse-client";
import type { PreconBrowseToolbarState } from "@/components/precons/precon-browse-toolbar";
import { parseColorsFromParam } from "@/lib/browse/color-identity-filter";
import { prisma } from "@/lib/db";
import {
  buildPreconTypeFilterOptions,
  listDistinctPreconTypes,
  listPrecons,
  parsePreconOrder,
  parsePreconSort,
} from "@/lib/precons/precons";
import { createPageMetadata } from "@/lib/seo/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = createPageMetadata({
  title: "Precons",
  description:
    "Browse official Magic constructed precons, check owned cards, and fork into a private deck.",
  path: "/precons",
});

type PreconsPageProps = {
  searchParams: Promise<{
    q?: string;
    format?: string;
    type?: string;
    color?: string;
    sort?: string;
    order?: string;
  }>;
};

export default async function PreconsPage({ searchParams }: PreconsPageProps) {
  const params = await searchParams;
  const toolbar: PreconBrowseToolbarState = {
    query: params.q?.trim() ?? "",
    format: params.format?.trim() ?? "",
    type: params.type?.trim().toLowerCase() ?? "",
    colors: parseColorsFromParam(params.color),
    sort: parsePreconSort(params.sort),
    order: parsePreconOrder(params.order),
  };
  const initialRequestKey = JSON.stringify(toolbar);

  const [result, types] = await Promise.all([
    listPrecons(prisma, {
      q: toolbar.query,
      format: toolbar.format || null,
      type: toolbar.type || null,
      colors: toolbar.colors,
      sort: toolbar.sort,
      order: toolbar.order,
    }),
    listDistinctPreconTypes(prisma),
  ]);

  return (
    <PreconsBrowseClient
      initialData={{
        items: result.items,
        total: result.total,
        nextCursor: result.nextCursor,
      }}
      initialToolbar={toolbar}
      initialRequestKey={initialRequestKey}
      typeOptions={buildPreconTypeFilterOptions(types)}
    />
  );
}
