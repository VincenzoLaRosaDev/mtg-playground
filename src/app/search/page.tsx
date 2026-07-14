import type { Metadata } from "next";
import { Suspense } from "react";

import { PageShell } from "@/components/layout/page-shell";
import { createPageMetadata } from "@/lib/seo/site";

import SearchPage from "./search-page";

export const metadata: Metadata = createPageMetadata({
  title: "Search",
  description: "Search cards, commanders, and Magic sets across EDHForge.",
  path: "/search",
  noIndex: true,
});

function SearchPageFallback() {
  return (
    <PageShell
      title="Search"
      description="Find cards, commanders, and sets across the EDHForge catalog."
    >
      <p className="text-sm text-muted-foreground">Loading search...</p>
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
