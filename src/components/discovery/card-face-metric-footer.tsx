import { EntityPreviewFooter } from "@/components/discovery/entity-preview-footer";
import type { EdhrecCardView } from "@/lib/edhrec/types";
import { formatInclusionPercent } from "@/lib/display/formatters";

type CardFaceMetricFooterProps = {
  card: EdhrecCardView;
  commanderNumDecks?: number | null;
  showSynergy?: boolean;
  prices?: unknown;
  /** Prefer cache-enriched salt when cardlist cardviews omit it. */
  salt?: number | null;
};

export function CardFaceMetricFooter({
  card,
  commanderNumDecks,
  showSynergy = false,
  prices,
  salt,
}: CardFaceMetricFooterProps) {
  const inclusionLabel = formatInclusionPercent(
    card.inclusion,
    card.potential_decks ?? commanderNumDecks ?? null,
    card.num_decks,
  );

  return (
    <EntityPreviewFooter
      prices={prices}
      primary={{ kind: "inclusion", value: inclusionLabel }}
      decks={card.num_decks}
      synergy={showSynergy ? card.synergy : null}
      salt={salt ?? card.salt ?? null}
    />
  );
}
