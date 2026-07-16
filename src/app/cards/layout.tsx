import type { Metadata } from "next";

import { EdhrecSyncNotice } from "@/components/discovery/edhrec-sync-notice";
import { createPageMetadata } from "@/lib/seo/site";

export const metadata: Metadata = createPageMetadata({
  title: "Top cards",
  description:
    "Most played Commander staples ranked by EDHREC inclusion, deck count, and salt.",
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
