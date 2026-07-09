import type { Metadata } from "next";

import { EdhrecSyncNotice } from "@/components/discovery/edhrec-sync-notice";
import { createPageMetadata } from "@/lib/seo/site";

export const metadata: Metadata = createPageMetadata({
  title: "Browse commanders",
  description:
    "Browse top EDHREC commanders by rank, salt, and popularity with detailed meta profiles.",
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
