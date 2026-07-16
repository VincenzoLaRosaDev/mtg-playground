import { CardFaceTile } from "@/components/discovery/card-face-tile";
import { EntityPreviewFooter } from "@/components/discovery/entity-preview-footer";
import type { CardBrowseItem } from "@/lib/browse/cards-shared";
import { formatInclusionPercent } from "@/lib/display/formatters";

type CardGridTileProps = {
  card: CardBrowseItem;
  /** Kept for API compatibility; rank is no longer the primary card preview metric. */
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
  preferCommanderLink = false,
}: CardGridTileProps) {
  const href = resolveCardHref(card, preferCommanderLink);
  const inclusionLabel = formatInclusionPercent(
    card.inclusion,
    card.potentialDecks,
    card.numDecks,
  );

  return (
    <CardFaceTile
      href={href}
      imageUri={card.imageUri}
      name={card.name}
      footer={
        <EntityPreviewFooter
          prices={card.prices}
          primary={{ kind: "inclusion", value: inclusionLabel }}
          decks={card.numDecks}
          salt={card.salt}
        />
      }
    />
  );
}
