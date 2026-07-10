import type { Metadata } from "next";

import { createPageMetadata } from "@/lib/seo/site";

export const metadata: Metadata = createPageMetadata({
  title: "Browse cards",
  description:
    "Browse popular staples and the full Commander-legal card catalog with filters and sort.",
  path: "/cards",
});

export default function CardsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
