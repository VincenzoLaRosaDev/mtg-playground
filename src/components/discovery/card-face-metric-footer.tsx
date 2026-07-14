import { RankBadge } from "@/components/discovery/rank-badge";
import { SaltBadge } from "@/components/discovery/salt-badge";
import {
  InclusionMetricLabel,
  SynergyMetricLabel,
} from "@/components/discovery/metric-icon-label";
import type { EdhrecCardView } from "@/lib/edhrec/types";
import { formatInclusionPercent, formatSynergyPercent } from "@/lib/display/formatters";

type CardFaceMetricFooterProps = {
  card: EdhrecCardView;
  commanderNumDecks?: number | null;
  showSynergy?: boolean;
  showRank?: boolean;
};

export function CardFaceMetricFooter({
  card,
  commanderNumDecks,
  showSynergy = false,
  showRank = false,
}: CardFaceMetricFooterProps) {
  const inclusionLabel = formatInclusionPercent(
    card.inclusion,
    card.potential_decks ?? commanderNumDecks ?? null,
    card.num_decks,
  );
  const synergyLabel =
    showSynergy && card.synergy != null ? formatSynergyPercent(card.synergy) : null;

  if (
    !showRank &&
    card.rank == null &&
    synergyLabel == null &&
    inclusionLabel === "—" &&
    card.salt == null
  ) {
    return null;
  }

  return (
    <>
      {showRank && card.rank != null ? <RankBadge rank={card.rank} className="shrink-0" /> : null}
      {synergyLabel ? <SynergyMetricLabel value={synergyLabel} /> : null}
      {inclusionLabel !== "—" ? <InclusionMetricLabel value={inclusionLabel} /> : null}
      {card.salt != null ? <SaltBadge salt={card.salt} className="shrink-0" /> : null}
    </>
  );
}
