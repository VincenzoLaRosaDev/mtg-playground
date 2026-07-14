import Link from "next/link";
import type { ReactNode } from "react";

import { Card, CardContent } from "@/components/ui/card";

import { CardFacePlaceholder, CardImage } from "@/components/discovery/card-image";
import { DevEdhrecCoverageBadge } from "@/components/dev/dev-edhrec-coverage-badge";
import { RankBadge } from "@/components/discovery/rank-badge";
import { SaltBadge } from "@/components/discovery/salt-badge";
import { DecksMetricLabel, InclusionMetricLabel } from "@/components/discovery/metric-icon-label";
import { ColorIdentity } from "@/components/mtg/color-identity";
import type { CardBrowseItem } from "@/lib/browse/cards-shared";
import { formatInclusionPercent } from "@/lib/display/formatters";

type CardBrowseRowProps = {
  card: CardBrowseItem;
  showCoverageBadge?: boolean;
  showRank?: boolean;
};

function formatPopularMeta(card: CardBrowseItem): ReactNode {
  const inclusionLabel = formatInclusionPercent(
    card.inclusion,
    card.potentialDecks,
    card.numDecks,
  );

  if (inclusionLabel !== "—") {
    return <InclusionMetricLabel value={inclusionLabel} />;
  }

  if (card.numDecks != null) {
    return <DecksMetricLabel value={card.numDecks.toLocaleString()} />;
  }

  return null;
}

export function CardBrowseRow({
  card,
  showCoverageBadge = false,
  showRank = false,
}: CardBrowseRowProps) {
  const href = card.edhrecSlug ? `/cards/${card.edhrecSlug}` : null;
  const popularMeta = formatPopularMeta(card);

  return (
    <li>
      <Card size="sm" className="shadow-sm">
        <CardContent className="flex items-center gap-4 py-3">
      {showRank && card.rank != null ? (
        <RankBadge rank={card.rank} className="shrink-0" />
      ) : null}
      {card.imageUri ? (
        <CardImage src={card.imageUri} alt={card.name} variant="thumbnail" />
      ) : (
        <CardFacePlaceholder />
      )}

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          {href ? (
            <Link href={href} className="font-medium hover:underline">
              {card.name}
            </Link>
          ) : (
            <p className="font-medium">{card.name}</p>
          )}

          {showCoverageBadge && !card.hasEdhrecData && (
            <DevEdhrecCoverageBadge label="No EDHREC data" />
          )}

          {card.salt != null && <SaltBadge salt={card.salt} />}
        </div>

        <p className="text-sm text-muted-foreground">{card.typeLine}</p>
        <p className="flex flex-nowrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <span className="shrink-0 whitespace-nowrap">
            CMC {card.cmc}
            {card.isCommander ? " · Commander" : ""}
          </span>
          <span className="flex shrink-0 items-center gap-1.5 whitespace-nowrap">
            {card.colorIdentity.length > 0 ? (
              <ColorIdentity colors={card.colorIdentity} size="xs" />
            ) : null}
            {popularMeta}
          </span>
        </p>
      </div>
        </CardContent>
      </Card>
    </li>
  );
}
