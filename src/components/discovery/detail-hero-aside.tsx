"use client";

import { useEffect, useRef, useState } from "react";

import { CardImage } from "@/components/discovery/card-image";
import { DetailHeroBadges } from "@/components/discovery/detail-hero-badges";
import { DetailSectionNav } from "@/components/discovery/detail-section-nav";
import type { DetailSectionNavItem } from "@/lib/ui/detail-section-nav";
import { CARD_FACE_RADIUS_CLASS } from "@/lib/ui/card-face";

const STICKY_TOP_OFFSET_PX = 24;
const COMPACT_IMAGE_WIDTH_CLASS = "w-[120px]";

type DetailHeroAsideProps = {
  imageUri: string | null;
  imageAlt: string;
  setName?: string | null;
  setCode?: string | null;
  rank?: number | null;
  salt?: number | null;
  allTimeRank?: boolean;
  sectionNavItems?: DetailSectionNavItem[];
};

export function DetailHeroAside({
  imageUri,
  imageAlt,
  setName,
  setCode,
  rank,
  salt,
  allTimeRank = false,
  sectionNavItems = [],
}: DetailHeroAsideProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [isStuck, setIsStuck] = useState(false);
  const hasNav = sectionNavItems.length >= 2;

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry) {
          setIsStuck(!entry.isIntersecting);
        }
      },
      {
        threshold: 0,
        rootMargin: `-${STICKY_TOP_OFFSET_PX}px 0px 0px 0px`,
      },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="relative w-[300px] max-w-full shrink-0 self-stretch">
      <div
        ref={sentinelRef}
        className="pointer-events-none h-px w-full shrink-0"
        aria-hidden
      />

      <aside
        className={`sticky top-6 flex w-full flex-col gap-3 ${
          hasNav ? "max-h-[calc(100dvh-1.5rem)]" : ""
        }`}
      >
        <div
          className={`shrink-0 overflow-hidden transition-[width] duration-300 ease-out ${
            isStuck ? COMPACT_IMAGE_WIDTH_CLASS : "w-full"
          }`}
        >
          {imageUri ? (
            <CardImage src={imageUri} alt={imageAlt} variant="detail" />
          ) : (
            <div
              className={`flex aspect-[488/680] w-full items-center justify-center ${CARD_FACE_RADIUS_CLASS} border border-border bg-muted text-sm text-muted-foreground`}
            >
              No image available
            </div>
          )}
        </div>

        {setName && setCode ? (
          <p
            className={`shrink-0 overflow-hidden text-xs text-muted-foreground transition-all duration-300 ease-out ${
              isStuck ? "max-h-0 opacity-0" : "max-h-8 opacity-100"
            }`}
          >
            Showing {setName} ({setCode.toUpperCase()}) printing
          </p>
        ) : null}

        <DetailHeroBadges rank={rank} salt={salt} allTimeRank={allTimeRank} className="shrink-0" />

        <DetailSectionNav items={sectionNavItems} scrollable />
      </aside>
    </div>
  );
}
