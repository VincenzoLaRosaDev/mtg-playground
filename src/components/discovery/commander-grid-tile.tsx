"use client";

import { CardFaceTile } from "@/components/discovery/card-face-tile";
import { useCardDetailModal } from "@/components/discovery/card-detail-modal-provider";
import { EntityPreviewFooter } from "@/components/discovery/entity-preview-footer";
import type { CommanderBrowseItem } from "@/lib/browse/commanders-shared";

type CommanderGridTileProps = {
  commander: CommanderBrowseItem;
  /** Kept for API compatibility; rank is no longer shown. */
  showRank?: boolean;
};

export function CommanderGridTile({ commander }: CommanderGridTileProps) {
  const { openCardDetail } = useCardDetailModal();
  const href = `/cards/${commander.slug}`;

  return (
    <CardFaceTile
      href={href}
      onOpen={() =>
        openCardDetail({
          mode: "collection",
          slug: commander.slug,
          imageUri: commander.imageUri,
        })
      }
      imageUri={commander.imageUri}
      name={commander.name}
      footer={
        <EntityPreviewFooter
          prices={commander.prices}
          popularityRank={commander.popularityRank}
        />
      }
    />
  );
}
