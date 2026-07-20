import { CardFaceTile } from "@/components/discovery/card-face-tile";
import { EntityPreviewFooter } from "@/components/discovery/entity-preview-footer";
import type { CardBrowseItem } from "@/lib/browse/cards-shared";

type CardGridTileProps = {
  card: CardBrowseItem;
  /** Kept for API compatibility with older call sites. */
  showRank?: boolean;
  /** When false, omit inclusion rank (rare; default show with honest label). */
  showInclusionRank?: boolean;
};

export function CardGridTile({
  card,
  showInclusionRank = true,
}: CardGridTileProps) {
  const href = card.slug ? `/cards/${card.slug}` : null;

  return (
    <CardFaceTile
      href={href}
      imageUri={card.imageUri}
      faces={card.faces}
      name={card.name}
      footer={
        <EntityPreviewFooter
          prices={card.prices}
          popularityRank={card.popularityRank}
          showInclusionRank={showInclusionRank}
          frictionScore={card.frictionScore}
        />
      }
    />
  );
}
