import {
  CardDetailHeroSkeleton,
  DetailListsBandSkeleton,
} from "@/components/discovery/loading-skeletons";
import { PageShell } from "@/components/layout/page-shell";

export default function CardDetailLoading() {
  return (
    <PageShell
      title="…"
      description="Loading card…"
      breadcrumbs={[
        { label: "Browse", href: "/browse" },
        { label: "…", href: "#" },
      ]}
    >
      <CardDetailHeroSkeleton />
      <DetailListsBandSkeleton />
    </PageShell>
  );
}
