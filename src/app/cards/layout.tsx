import type { Metadata } from "next";

import { EdhrecSyncNotice } from "@/components/discovery/edhrec-sync-notice";
import { createPageMetadata } from "@/lib/seo/site";

export const metadata: Metadata = createPageMetadata({
  title: "Search cards",
  description:
    "Search the Commander-legal card catalog with Scryfall data and EDHREC stats on detail pages.",
  path: "/cards",
});

export default function CardsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <EdhrecSyncNotice />
      {children}
    </>
  );
}
