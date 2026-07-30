"use client";

import { CardFaceTile } from "@/components/discovery/card-face-tile";
import { useCardDetailModal } from "@/components/discovery/card-detail-modal-provider";
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
  const { openCardDetail } = useCardDetailModal();
  const href = card.slug ? `/cards/${card.slug}` : null;

  return (
    <CardFaceTile
      href={href}
      onOpen={
        card.slug || card.id
          ? () =>
              openCardDetail({
                mode: "collection",
                slug: card.slug ?? undefined,
                cardId: card.id,
                imageUri: card.imageUri,
                faces: card.faces,
              })
          : undefined
      }
      imageUri={card.imageUri}
      faces={card.faces}
      name={card.name}
      footer={
        <EntityPreviewFooter
          prices={card.prices}
          popularityRank={card.popularityRank}
          showInclusionRank={showInclusionRank}
        />
      }
    />
  );
}
