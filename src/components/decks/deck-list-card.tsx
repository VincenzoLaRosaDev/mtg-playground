"use client";

import { Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { ManaShareBar } from "@/components/mtg/mana-share-bar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import type { DeckListItem } from "@/lib/decks/decks";
import { toScryfallArtCropUri } from "@/lib/scryfall/image-uri";
import { formatRelativeTime } from "@/lib/ui/relative-time";
import { cn } from "@/lib/utils";

type DeckListCardProps = {
  deck: DeckListItem;
  deletePending: boolean;
  onDelete: () => void;
};

export function DeckListCard({
  deck,
  deletePending,
  onDelete,
}: DeckListCardProps) {
  const href = `/decks/${deck.id}`;
  const coverSrc = toScryfallArtCropUri(deck.coverImageUri);
  const overlay = [
    deck.formatLabel,
    deck.sizeLabel,
    formatRelativeTime(deck.updatedAt),
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <li className="min-w-0">
      <Card
        size="sm"
        className="relative h-full gap-0 py-0 shadow-sm transition-colors hover:bg-accent/20"
      >
        {/* Stretched hit target; siblings use pointer-events-none so clicks reach it. */}
        <Link
          href={href}
          className="absolute inset-0 z-0 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          aria-label={`Open ${deck.name}`}
        />

        <div className="pointer-events-none relative aspect-3/2 overflow-hidden rounded-t-xl">
          {coverSrc ? (
            <Image
              src={coverSrc}
              alt=""
              fill
              sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, (max-width: 1536px) 20vw, 14vw"
              className="object-cover object-center"
              unoptimized
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-muted text-xs text-muted-foreground">
              No cover
            </div>
          )}
          <div
            className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/75 via-black/40 to-transparent px-2 pb-1.5 pt-6"
            aria-hidden
          />
          <p className="absolute inset-x-0 bottom-0 truncate px-2 pb-1.5 text-[10px] font-medium tabular-nums text-white drop-shadow-sm sm:text-[11px]">
            {overlay}
          </p>
        </div>

        <div className="pointer-events-none px-2 pt-1.5 sm:px-2.5">
          <ManaShareBar
            segments={deck.costSegments}
            ariaLabel={`Mana cost for ${deck.name}`}
            empty="No spell pips"
            size="sm"
          />
        </div>

        <CardContent className="pointer-events-none relative z-10 flex items-center justify-between gap-2 px-2 py-2 sm:px-2.5 sm:py-2.5">
          <span className="min-w-0 truncate text-sm font-medium text-foreground">
            {deck.name}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              "pointer-events-auto h-7 shrink-0 px-2 text-xs text-destructive hover:text-destructive",
            )}
            disabled={deletePending}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onDelete();
            }}
          >
            <Icon icon={Trash2} size="sm" />
            Delete
          </Button>
        </CardContent>
      </Card>
    </li>
  );
}
