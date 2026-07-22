import {
  BrowseToolbarSkeleton,
  CardGridSkeleton,
  PageListMetaSkeleton,
} from "@/components/discovery/loading-skeletons";
import { PageShell } from "@/components/layout/page-shell";

export default function SetDetailLoading() {
  return (
    <PageShell
      title="…"
      description="Loading set…"
      breadcrumbs={[
        { label: "Sets", href: "/sets" },
        { label: "…", href: "#" },
      ]}
      toolbar={<BrowseToolbarSkeleton variant="setDetail" />}
    >
      <PageListMetaSkeleton />
      <div className="mt-6">
        <CardGridSkeleton count={12} footerLines={1} />
      </div>
    </PageShell>
  );
}
