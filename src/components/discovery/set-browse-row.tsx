import Image from "next/image";
import Link from "next/link";

import type { SetBrowseItem } from "@/lib/browse/sets-shared";
import { formatReleaseDate, formatSetType } from "@/lib/scryfall/sets";
import { Card, CardContent } from "@/components/ui/card";

type SetBrowseRowProps = {
  set: SetBrowseItem;
};

export function SetBrowseRow({ set }: SetBrowseRowProps) {
  return (
    <li className="min-w-0">
      <Card size="sm" className="h-full shadow-sm transition-colors hover:bg-accent/30">
        <CardContent className="flex h-full items-center gap-4">
          {set.iconUri ? (
            <div className="relative h-10 w-10 shrink-0">
              <Image src={set.iconUri} alt="" fill className="object-contain" unoptimized />
            </div>
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-muted text-xs text-muted-foreground">
              ?
            </div>
          )}

          <div className="min-w-0 flex-1">
            <Link href={`/sets/${set.code}`} className="font-medium hover:underline">
              {set.name}
            </Link>
            <p className="mt-0.5 truncate text-sm text-muted-foreground">
              {set.code.toUpperCase()} · {formatSetType(set.setType)}
              {set.digital ? " · Digital" : ""}
            </p>
            <p className="mt-1 flex flex-nowrap items-center justify-between gap-2 text-xs text-muted-foreground">
              <span className="shrink-0 whitespace-nowrap">
                {formatReleaseDate(set.releasedAt ? new Date(set.releasedAt) : null)}
              </span>
              <span className="truncate text-right">
                {set.indexedCardCount > 0
                  ? `${set.indexedCardCount.toLocaleString()} indexed`
                  : `${set.cardCount.toLocaleString()} cards`}
              </span>
            </p>
          </div>
        </CardContent>
      </Card>
    </li>
  );
}
