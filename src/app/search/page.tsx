import type { Metadata } from "next";
import { Suspense } from "react";

import {
  CardGridSkeleton,
  PageListMetaSkeleton,
} from "@/components/discovery/loading-skeletons";
import { PageShell } from "@/components/layout/page-shell";
import { createPageMetadata } from "@/lib/seo/site";

import SearchPage from "./search-page";

export const metadata: Metadata = createPageMetadata({
  title: "Search",
  description: "Search cards, commanders, and Magic sets across MTGPlayground.",
  path: "/search",
  noIndex: true,
});

function SearchPageFallback() {
  return (
    <PageShell
      title="Search"
      description="Find cards, commanders, and sets across the MTGPlayground catalog."
    >
      <PageListMetaSkeleton />
      <div className="mt-6">
        <CardGridSkeleton count={8} />
      </div>
    </PageShell>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<SearchPageFallback />}>
      <SearchPage />
    </Suspense>
  );
}
