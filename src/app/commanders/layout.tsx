import type { Metadata } from "next";

import { createPageMetadata } from "@/lib/seo/site";

export const metadata: Metadata = createPageMetadata({
  title: "Top commanders",
  description:
    "Most popular commanders ranked by EDHREC, with deck count, salt, and filters.",
  path: "/commanders",
});

export default function CommandersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
