import { CardFaceTile } from "@/components/discovery/card-face-tile";
import { RankBadge } from "@/components/discovery/rank-badge";
import { SaltBadge } from "@/components/discovery/salt-badge";
import type { CommanderBrowseItem } from "@/lib/browse/commanders-shared";

type CommanderGridTileProps = {
  commander: CommanderBrowseItem;
  showRank?: boolean;
};

export function CommanderGridTile({ commander, showRank = true }: CommanderGridTileProps) {
  const href = `/commanders/${commander.slug}`;
  const popularityLabel =
    commander.numDecks != null ? `${commander.numDecks.toLocaleString()} decks` : null;

  const footer =
    (showRank && commander.rank != null) || popularityLabel || commander.salt != null ? (
      <>
        {showRank && commander.rank != null ? (
          <RankBadge rank={commander.rank} className="shrink-0" />
        ) : null}
        {popularityLabel ? (
          <span className="shrink-0 whitespace-nowrap text-xs tabular-nums text-muted-foreground">
            {popularityLabel}
          </span>
        ) : null}
        {commander.salt != null ? <SaltBadge salt={commander.salt} className="shrink-0" /> : null}
      </>
    ) : null;

  return (
    <CardFaceTile
      href={href}
      imageUri={commander.imageUri}
      name={commander.name}
      footer={footer}
    />
  );
}
