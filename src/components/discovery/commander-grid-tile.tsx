import { CardFaceTile } from "@/components/discovery/card-face-tile";
import { EntityPreviewFooter } from "@/components/discovery/entity-preview-footer";
import type { CommanderBrowseItem } from "@/lib/browse/commanders-shared";
import { formatRank } from "@/lib/display/formatters";

type CommanderGridTileProps = {
  commander: CommanderBrowseItem;
  showRank?: boolean;
};

export function CommanderGridTile({ commander, showRank = true }: CommanderGridTileProps) {
  const href = `/commanders/${commander.slug}`;
  const rankLabel =
    showRank && commander.rank != null ? formatRank(commander.rank) : null;

  return (
    <CardFaceTile
      href={href}
      imageUri={commander.imageUri}
      name={commander.name}
      footer={
        <EntityPreviewFooter
          prices={commander.prices}
          primary={{ kind: "rank", value: rankLabel }}
          decks={commander.numDecks}
          salt={commander.salt}
        />
      }
    />
  );
}
