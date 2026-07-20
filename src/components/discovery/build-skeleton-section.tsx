import { DetailSectionPanel } from "@/components/discovery/detail-section-panel";
import {
  BUILD_SKELETON_LANDS_NOTE,
  type BuildSkeletonRow,
} from "@/lib/discovery/detail-pack";
import { DETAIL_SECTION_IDS } from "@/lib/ui/detail-section-nav";

type BuildSkeletonSectionProps = {
  rows: BuildSkeletonRow[];
};

export function BuildSkeletonSection({ rows }: BuildSkeletonSectionProps) {
  return (
    <DetailSectionPanel
      id={DETAIL_SECTION_IDS.buildSkeleton}
      title="Build skeleton"
    >
      <p className="mt-2 text-sm text-muted-foreground">
        Target package counts for a typical Commander list — not an average deck. Counts show
        how many classified cards are available in this commander&apos;s color identity.
      </p>
      <ul className="mt-4 space-y-2 text-sm">
        {rows.map((row) => (
          <li
            key={row.key}
            className="flex items-baseline justify-between gap-4 border-b border-border/60 py-1.5 last:border-0"
          >
            <span className="font-medium capitalize">{row.label}</span>
            <span className="tabular-nums text-muted-foreground">
              target {row.target} · {row.availableInCi.toLocaleString()} in CI
            </span>
          </li>
        ))}
        <li className="flex items-baseline justify-between gap-4 py-1.5 text-muted-foreground">
          <span>Lands</span>
          <span>{BUILD_SKELETON_LANDS_NOTE}</span>
        </li>
      </ul>
    </DetailSectionPanel>
  );
}
