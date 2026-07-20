import { CardFaceTile } from "@/components/discovery/card-face-tile";
import { EntityPreviewFooter } from "@/components/discovery/entity-preview-footer";
import type { CommanderBrowseItem } from "@/lib/browse/commanders-shared";

type CommanderGridTileProps = {
  commander: CommanderBrowseItem;
  /** Kept for API compatibility; rank is no longer shown. */
  showRank?: boolean;
};

export function CommanderGridTile({ commander }: CommanderGridTileProps) {
  const href = `/cards/${commander.slug}`;

  return (
    <CardFaceTile
      href={href}
      imageUri={commander.imageUri}
      name={commander.name}
      footer={
        <EntityPreviewFooter
          prices={commander.prices}
          popularityRank={commander.popularityRank}
          frictionScore={commander.frictionScore}
        />
      }
    />
  );
}
