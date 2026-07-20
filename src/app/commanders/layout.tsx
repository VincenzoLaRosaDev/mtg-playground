import type { Metadata } from "next";

import { createPageMetadata } from "@/lib/seo/site";

export const metadata: Metadata = createPageMetadata({
  title: "Commanders",
  description: "Browse commander-legal legendaries from the Scryfall catalog.",
  path: "/commanders",
});

export default function CommandersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
