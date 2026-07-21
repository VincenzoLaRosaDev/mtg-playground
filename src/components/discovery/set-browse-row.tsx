import Link from "next/link";

import type { SetBrowseItem } from "@/lib/browse/sets-shared";
import { formatReleaseDate, formatSetType } from "@/lib/scryfall/sets";
import { SetIcon } from "@/components/mtg/set-icon";
import { Card, CardContent } from "@/components/ui/card";

type SetBrowseRowProps = {
  set: SetBrowseItem;
};

/** Entire row is the hit target — single destination, no nested controls. */
export function SetBrowseRow({ set }: SetBrowseRowProps) {
  return (
    <li className="min-w-0">
      <Link
        href={`/sets/${set.code}`}
        className="block h-full rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <Card
          size="sm"
          className="h-full shadow-sm transition-colors hover:bg-accent/30"
        >
          <CardContent className="flex h-full items-center gap-4">
            {set.iconUri ? (
              <SetIcon src={set.iconUri} />
            ) : (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-muted text-xs text-muted-foreground">
                ?
              </div>
            )}

            <div className="min-w-0 flex-1">
              <p className="font-medium">{set.name}</p>
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
      </Link>
    </li>
  );
}
