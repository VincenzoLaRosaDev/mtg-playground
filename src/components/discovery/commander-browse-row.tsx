import Link from "next/link";

import { CardImage } from "@/components/discovery/card-image";
import { DevEdhrecCoverageBadge } from "@/components/dev/dev-edhrec-coverage-badge";
import type { CommanderBrowseItem } from "@/lib/browse/commanders-shared";
import { formatColorIdentity, formatRank } from "@/lib/display/formatters";

type CommanderBrowseRowProps = {
  commander: CommanderBrowseItem;
  showCoverageBadge?: boolean;
};

export function CommanderBrowseRow({ commander, showCoverageBadge = false }: CommanderBrowseRowProps) {
  const href = `/commanders/${commander.slug}`;

  return (
    <li className="flex items-center gap-4 rounded-lg border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      {commander.imageUri ? (
        <CardImage src={commander.imageUri} alt={commander.name} variant="thumbnail" />
      ) : (
        <div className="flex h-[62px] w-[44px] shrink-0 items-center justify-center rounded border border-zinc-200 bg-zinc-100 text-xs text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900">
          ?
        </div>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Link href={href} className="font-medium hover:underline">
            {commander.name}
          </Link>

          {showCoverageBadge && !commander.hasEdhrecMeta && (
            <DevEdhrecCoverageBadge label="No EDHREC meta" />
          )}
        </div>

        {commander.typeLine && (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">{commander.typeLine}</p>
        )}

        <p className="text-xs text-zinc-500">
          Rank {formatRank(commander.rank)}
          {commander.salt != null ? ` · Salt ${commander.salt.toFixed(2)}` : ""}
          {commander.numDecks != null
            ? ` · ${commander.numDecks.toLocaleString()} decks`
            : ""}
          {commander.colorIdentity.length > 0
            ? ` · ${formatColorIdentity(commander.colorIdentity)}`
            : ""}
        </p>
      </div>
    </li>
  );
}
