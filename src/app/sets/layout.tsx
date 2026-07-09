import type { Metadata } from "next";

import { createPageMetadata } from "@/lib/seo/site";

export const metadata: Metadata = createPageMetadata({
  title: "Browse sets",
  description: "Browse Magic: The Gathering sets and explore Commander-legal cards by release.",
  path: "/sets",
});

export default function SetsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
