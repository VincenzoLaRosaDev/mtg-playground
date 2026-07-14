import { CardFaceTile } from "@/components/discovery/card-face-tile";
import { RankBadge } from "@/components/discovery/rank-badge";
import { SaltBadge } from "@/components/discovery/salt-badge";
import type { CardBrowseItem } from "@/lib/browse/cards-shared";
import { formatInclusionPercent } from "@/lib/display/formatters";

type CardGridTileProps = {
  card: CardBrowseItem;
  showRank?: boolean;
  /** When set, commander cards link to `/commanders/{slug}` instead of `/cards/{slug}`. */
  preferCommanderLink?: boolean;
};

function resolveCardHref(card: CardBrowseItem, preferCommanderLink: boolean): string | null {
  if (!card.edhrecSlug) {
    return null;
  }

  if (preferCommanderLink && card.isCommander) {
    return `/commanders/${card.edhrecSlug}`;
  }

  return `/cards/${card.edhrecSlug}`;
}

export function CardGridTile({
  card,
  showRank = true,
  preferCommanderLink = false,
}: CardGridTileProps) {
  const href = resolveCardHref(card, preferCommanderLink);
  const inclusionLabel = formatInclusionPercent(
    card.inclusion,
    card.potentialDecks,
    card.numDecks,
  );
  const popularityLabel =
    inclusionLabel !== "—" ? `${inclusionLabel} inclusion` : null;

  const footer =
    (showRank && card.rank != null) || popularityLabel || card.salt != null ? (
      <>
        {showRank && card.rank != null ? <RankBadge rank={card.rank} className="shrink-0" /> : null}
        {popularityLabel ? (
          <span className="shrink-0 whitespace-nowrap text-xs tabular-nums text-muted-foreground">
            {popularityLabel}
          </span>
        ) : null}
        {card.salt != null ? <SaltBadge salt={card.salt} className="shrink-0" /> : null}
      </>
    ) : null;

  return (
    <CardFaceTile href={href} imageUri={card.imageUri} name={card.name} footer={footer} />
  );
}
