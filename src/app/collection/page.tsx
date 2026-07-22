import type { Metadata } from "next";
import { Suspense } from "react";

import { auth } from "@/auth";
import { CollectionAddPanel } from "@/components/collection/collection-add-panel";
import { CollectionGrid } from "@/components/collection/collection-grid";
import { CollectionImportPanel } from "@/components/collection/collection-import-panel";
import { CollectionToolbar } from "@/components/collection/collection-toolbar";
import { PageShell } from "@/components/layout/page-shell";
import { prisma } from "@/lib/db";
import { listCollectionItems } from "@/lib/collection/collection";
import { parseCollectionListQuery } from "@/lib/collection/collection-filters";
import { createPageMetadata } from "@/lib/seo/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = createPageMetadata({
  title: "Collection",
  description: "Your printing-level Magic collection and wish list.",
  path: "/collection",
  noIndex: true,
});

type CollectionPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default async function CollectionPage({ searchParams }: CollectionPageProps) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return null;
  }

  const params = await searchParams;
  const query = parseCollectionListQuery({
    filter: firstParam(params.filter),
    sort: firstParam(params.sort),
    order: firstParam(params.order),
    q: firstParam(params.q),
    color: firstParam(params.color),
    rarity: firstParam(params.rarity),
    type: firstParam(params.type),
    cmc_min: firstParam(params.cmc_min),
    cmc_max: firstParam(params.cmc_max),
    format: firstParam(params.format),
    finish: firstParam(params.finish),
    set: firstParam(params.set),
  });

  const initial = await listCollectionItems(prisma, userId, query);

  return (
    <PageShell
      title="Collection"
      description="Printing-level inventory — set, collector number, and finish."
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Collection", href: "/collection" },
      ]}
      toolbar={
        <Suspense fallback={<div className="h-24" aria-hidden />}>
          <CollectionToolbar
            actions={
              <>
                <CollectionAddPanel />
                <CollectionImportPanel />
              </>
            }
          />
        </Suspense>
      }
    >
      <Suspense fallback={<div className="h-40" aria-hidden />}>
        <CollectionGrid initial={initial} />
      </Suspense>
    </PageShell>
  );
}
