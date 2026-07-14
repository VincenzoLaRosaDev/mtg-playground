import type { Metadata } from "next";

import { createPageMetadata } from "@/lib/seo/site";

export const metadata: Metadata = createPageMetadata({
  title: "Catalog",
  description:
    "Browse the full Commander card catalog with filters for color, CMC, type, and commanders only.",
  path: "/catalog",
});

export default function CatalogLayout({ children }: { children: React.ReactNode }) {
  return children;
}
