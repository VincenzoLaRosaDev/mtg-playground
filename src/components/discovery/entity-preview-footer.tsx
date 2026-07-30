import {
  formatInclusionRank,
  INCLUSION_RANK_SHORT_LABEL,
  INCLUSION_RANK_TITLE,
} from "@/lib/display/inclusion-rank";
import { PriceChip } from "@/components/discovery/price-chip";
import type { PrintingFinish } from "@/lib/scryfall/card-printing";
import { cn } from "@/lib/utils";

type EntityPreviewFooterProps = {
  prices?: unknown;
  preferredFinish?: PrintingFinish | null;
  popularityRank?: number | null;
  /** When false, omit inclusion rank. */
  showInclusionRank?: boolean;
  className?: string;
};

/** Compact footer under card faces — Price + EDH Inclusion. */
export function EntityPreviewFooter({
  prices,
  preferredFinish,
  popularityRank,
  showInclusionRank = true,
  className,
}: EntityPreviewFooterProps) {
  const inclusion = showInclusionRank ? formatInclusionRank(popularityRank) : null;
  const hasPrice = prices != null;

  if (!hasPrice && !inclusion) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex w-full min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground",
        className,
      )}
    >
      {hasPrice ? (
        <PriceChip
          prices={prices}
          preferredFinish={preferredFinish}
          className="min-w-0"
        />
      ) : null}
      {inclusion ? (
        <span title={INCLUSION_RANK_TITLE} className="shrink-0">
          {INCLUSION_RANK_SHORT_LABEL} {inclusion}
        </span>
      ) : null}
    </div>
  );
}
