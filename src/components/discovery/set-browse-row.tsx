import Image from "next/image";
import Link from "next/link";

import type { SetBrowseItem } from "@/lib/browse/sets-shared";
import { formatReleaseDate, formatSetType } from "@/lib/scryfall/sets";

type SetBrowseRowProps = {
  set: SetBrowseItem;
};

export function SetBrowseRow({ set }: SetBrowseRowProps) {
  return (
    <li className="flex items-center gap-4 rounded-lg border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      {set.iconUri ? (
        <div className="relative h-8 w-8 shrink-0">
          <Image src={set.iconUri} alt="" fill className="object-contain" unoptimized />
        </div>
      ) : (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-zinc-100 text-xs text-zinc-400 dark:bg-zinc-900">
          ?
        </div>
      )}

      <div className="min-w-0 flex-1">
        <Link href={`/sets/${set.code}`} className="font-medium hover:underline">
          {set.name}
        </Link>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {set.code.toUpperCase()} · {formatSetType(set.setType)}
          {set.digital ? " · Digital" : ""}
        </p>
        <p className="text-xs text-zinc-500">
          {formatReleaseDate(set.releasedAt ? new Date(set.releasedAt) : null)}
          {" · "}
          {set.indexedCardCount > 0
            ? `${set.indexedCardCount.toLocaleString()} cards indexed`
            : `${set.cardCount.toLocaleString()} cards (not indexed yet)`}
        </p>
      </div>
    </li>
  );
}
