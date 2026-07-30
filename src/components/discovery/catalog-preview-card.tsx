"use client";

import Image from "next/image";
import Link from "next/link";

import { ManaShareBar, type ManaShareSegment } from "@/components/mtg/mana-share-bar";
import { SetIcon } from "@/components/mtg/set-icon";
import { Card, CardContent } from "@/components/ui/card";
import { toScryfallArtCropUri } from "@/lib/scryfall/image-uri";

export type CatalogPreviewCardProps = {
  href: string;
  name: string;
  /** Stored normal URI; rendered as art_crop. */
  coverImageUri: string | null;
  coverAlt?: string;
  overlay: string;
  setIconUri: string | null;
  /** Secondary line under the name (format/type/code). */
  meta?: string;
  costSegments?: readonly ManaShareSegment[];
  ariaLabel?: string;
};

/**
 * Browse preview tile (sets / precons): art_crop header, optional mana bar,
 * set icon + name. Whole card is the link (pointer-events pattern).
 */
export function CatalogPreviewCard({
  href,
  name,
  coverImageUri,
  coverAlt = "",
  overlay,
  setIconUri,
  meta,
  costSegments,
  ariaLabel,
}: CatalogPreviewCardProps) {
  const coverSrc = toScryfallArtCropUri(coverImageUri);

  return (
    <li className="min-w-0">
      <Card
        size="sm"
        className="relative h-full gap-0 py-0 shadow-sm transition-colors hover:bg-accent/20"
      >
        <Link
          href={href}
          className="absolute inset-0 z-0 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          aria-label={ariaLabel ?? `Open ${name}`}
        />

        <div className="pointer-events-none relative aspect-3/2 overflow-hidden rounded-t-xl">
          {coverSrc ? (
            <Image
              src={coverSrc}
              alt={coverAlt}
              fill
              sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, (max-width: 1536px) 20vw, 14vw"
              className="object-cover object-center"
              unoptimized
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-muted">
              {setIconUri ? (
                <SetIcon src={setIconUri} className="h-12 w-12 opacity-80" />
              ) : (
                <span className="text-xs text-muted-foreground">No cover</span>
              )}
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

        {costSegments ? (
          <div className="pointer-events-none px-2 pt-1.5 sm:px-2.5">
            <ManaShareBar
              segments={costSegments}
              ariaLabel={`Mana cost for ${name}`}
              empty="No spell pips"
              size="sm"
            />
          </div>
        ) : null}

        <CardContent className="pointer-events-none relative z-10 flex items-center gap-2 px-2 py-2 sm:px-2.5 sm:py-2.5">
          {setIconUri ? (
            <SetIcon src={setIconUri} className="h-8 w-8 shrink-0" />
          ) : (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-muted text-[10px] text-muted-foreground">
              ?
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{name}</p>
            {meta ? (
              <p className="truncate text-xs text-muted-foreground">{meta}</p>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </li>
  );
}
