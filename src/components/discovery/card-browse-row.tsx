import Link from "next/link";

import { CardImage } from "@/components/discovery/card-image";
import { DevEdhrecCoverageBadge } from "@/components/dev/dev-edhrec-coverage-badge";
import type { CardBrowseItem } from "@/lib/browse/cards-shared";
import { formatColorIdentity } from "@/lib/display/formatters";

type CardBrowseRowProps = {
  card: CardBrowseItem;
  showCoverageBadge?: boolean;
};

function formatPopularMeta(card: CardBrowseItem): string {
  const parts: string[] = [];

  if (card.inclusion != null) {
    parts.push(`${card.inclusion.toLocaleString()} decks`);
  }

  if (card.salt != null) {
    parts.push(`Salt ${card.salt.toFixed(2)}`);
  }

  return parts.join(" · ");
}

export function CardBrowseRow({ card, showCoverageBadge = false }: CardBrowseRowProps) {
  const href = card.edhrecSlug ? `/cards/${card.edhrecSlug}` : null;
  const popularMeta = formatPopularMeta(card);

  return (
    <li className="flex items-center gap-4 rounded-lg border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      {card.imageUri ? (
        <CardImage src={card.imageUri} alt={card.name} variant="thumbnail" />
      ) : (
        <div className="flex h-[62px] w-[44px] shrink-0 items-center justify-center rounded border border-zinc-200 bg-zinc-100 text-xs text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900">
          ?
        </div>
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
        </div>

        <p className="text-sm text-zinc-600 dark:text-zinc-400">{card.typeLine}</p>
        <p className="text-xs text-zinc-500">
          CMC {card.cmc}
          {card.isCommander ? " · Commander" : ""}
          {card.colorIdentity.length > 0 ? ` · ${formatColorIdentity(card.colorIdentity)}` : ""}
          {popularMeta ? ` · ${popularMeta}` : ""}
        </p>
      </div>
    </li>
  );
}
