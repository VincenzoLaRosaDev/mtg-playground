import {
  BrowseToolbarSkeleton,
  CardGridSkeleton,
  PageListMetaSkeleton,
} from "@/components/discovery/loading-skeletons";
import { PageShell } from "@/components/layout/page-shell";

/** Stable browse chrome + toolbar/meta/grid slots (route Suspense / soft nav). */
export function BrowseHubFallback({
  title = "Browse",
  description = "Browse the Scryfall card catalog.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <PageShell
      title={title}
      description={description}
      toolbar={<BrowseToolbarSkeleton variant="hub" />}
    >
      <PageListMetaSkeleton />
      <div className="mt-6">
        <CardGridSkeleton />
      </div>
    </PageShell>
  );
}
