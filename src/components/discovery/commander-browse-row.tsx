import Link from "next/link";

import { CardFacePlaceholder, CardImage } from "@/components/discovery/card-image";
import { DevEdhrecCoverageBadge } from "@/components/dev/dev-edhrec-coverage-badge";
import { RankBadge } from "@/components/discovery/rank-badge";
import { SaltBadge } from "@/components/discovery/salt-badge";
import { DecksMetricLabel } from "@/components/discovery/metric-icon-label";
import { ColorIdentity } from "@/components/mtg/color-identity";
import { Card, CardContent } from "@/components/ui/card";
import type { CommanderBrowseItem } from "@/lib/browse/commanders-shared";

type CommanderBrowseRowProps = {
  commander: CommanderBrowseItem;
  showCoverageBadge?: boolean;
  showRank?: boolean;
};

export function CommanderBrowseRow({
  commander,
  showCoverageBadge = false,
  showRank = true,
}: CommanderBrowseRowProps) {
  const href = `/commanders/${commander.slug}`;

  return (
    <li>
      <Card size="sm" className="shadow-sm">
        <CardContent className="flex items-center gap-4 py-3">
      {showRank && commander.rank != null ? (
        <RankBadge rank={commander.rank} className="shrink-0" />
      ) : null}
      {commander.imageUri ? (
        <CardImage src={commander.imageUri} alt={commander.name} variant="thumbnail" />
      ) : (
        <CardFacePlaceholder />
      )}

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Link href={href} className="font-medium hover:underline">
            {commander.name}
          </Link>

          {showCoverageBadge && !commander.hasEdhrecMeta && (
            <DevEdhrecCoverageBadge label="No EDHREC meta" />
          )}

          {commander.salt != null && <SaltBadge salt={commander.salt} />}
        </div>

        {commander.typeLine && (
          <p className="text-sm text-muted-foreground">{commander.typeLine}</p>
        )}

        <p className="flex flex-nowrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <span className="flex shrink-0 items-center gap-1.5 whitespace-nowrap">
            {commander.numDecks != null ? (
              <DecksMetricLabel value={commander.numDecks.toLocaleString()} />
            ) : null}
            {commander.cmc != null ? <span>CMC {commander.cmc}</span> : null}
          </span>
          {commander.colorIdentity.length > 0 ? (
            <span className="shrink-0">
              <ColorIdentity colors={commander.colorIdentity} size="xs" />
            </span>
          ) : null}
        </p>
      </div>
        </CardContent>
      </Card>
    </li>
  );
}
