import type { Metadata } from "next";

import { createPageMetadata } from "@/lib/seo/site";

export const metadata: Metadata = createPageMetadata({
  title: "Cards",
  description: "Browse the Commander-legal card catalog from Scryfall.",
  path: "/cards",
});

export default function CardsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
