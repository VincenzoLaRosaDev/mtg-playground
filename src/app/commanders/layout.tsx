import type { Metadata } from "next";

import { EdhrecSyncNotice } from "@/components/discovery/edhrec-sync-notice";
import { createPageMetadata } from "@/lib/seo/site";

export const metadata: Metadata = createPageMetadata({
  title: "Top commanders",
  description:
    "Most popular commanders ranked by EDHREC, with deck count, salt, and filters.",
  path: "/commanders",
});

export default function CommandersLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <EdhrecSyncNotice />
      {children}
    </>
  );
}
