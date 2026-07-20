import type { Metadata } from "next";

import { createPageMetadata } from "@/lib/seo/site";

export const metadata: Metadata = createPageMetadata({
  title: "Browse",
  description:
    "Browse Scryfall cards and legal commanders. Inclusion rank is Commander deck inclusion, not commander popularity.",
  path: "/browse",
});

export default function BrowseLayout({ children }: { children: React.ReactNode }) {
  return children;
}
