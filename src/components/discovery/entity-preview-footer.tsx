import { PriceChip } from "@/components/discovery/price-chip";
import {
  formatInclusionRank,
  INCLUSION_RANK_SHORT_LABEL,
  INCLUSION_RANK_TITLE,
} from "@/lib/display/inclusion-rank";
import type { PrintingFinish } from "@/lib/scryfall/card-printing";

type EntityPreviewFooterProps = {
  prices?: unknown;
  preferredFinish?: PrintingFinish | null;
  popularityRank?: number | null;
  /** When false, omit inclusion rank. */
  showInclusionRank?: boolean;
  frictionScore?: number | null;
};

/** Compact footer under card faces — Price + Inclusion + Friction. */
export function EntityPreviewFooter({
  prices,
  preferredFinish,
  popularityRank,
  showInclusionRank = true,
  frictionScore,
}: EntityPreviewFooterProps) {
  const inclusion = showInclusionRank ? formatInclusionRank(popularityRank) : null;
  const showFriction = frictionScore != null && frictionScore > 0;
  const hasPrice = prices != null;

  if (!hasPrice && !inclusion && !showFriction) {
    return null;
  }

  return (
    <div className="flex w-full min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
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
      {showFriction ? (
        <span title="Friction score (Game Changer / stax-family tags)" className="shrink-0">
          Friction {frictionScore}
        </span>
      ) : null}
    </div>
  );
}
