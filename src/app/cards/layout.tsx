import type { Metadata } from "next";

import { createPageMetadata } from "@/lib/seo/site";

export const metadata: Metadata = createPageMetadata({
  title: "Top cards",
  description:
    "Most played Commander staples ranked by EDHREC inclusion, deck count, and salt.",
  path: "/cards",
});

export default function CardsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
