import type { Metadata } from "next";

import { createPageMetadata } from "@/lib/seo/site";

export const metadata: Metadata = createPageMetadata({
  title: "Browse commanders",
  description:
    "Browse ranked commanders by popularity, salt, and deck count with detailed profiles.",
  path: "/commanders",
});

export default function CommandersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
