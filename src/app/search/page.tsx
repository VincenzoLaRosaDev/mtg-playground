import type { Metadata } from "next";
import { Suspense } from "react";

import { createPageMetadata } from "@/lib/seo/site";

import SearchPage from "./search-page";

export const metadata: Metadata = createPageMetadata({
  title: "Search",
  description: "Search cards, commanders, and Magic sets across MTGPlayground.",
  path: "/search",
  noIndex: true,
});

/**
 * `useSearchParams` requires a Suspense boundary; fallback is null so we don’t
 * flash a page pending UI (block-fino-ai-dati).
 */
export default function Page() {
  return (
    <Suspense fallback={null}>
      <SearchPage />
    </Suspense>
  );
}
