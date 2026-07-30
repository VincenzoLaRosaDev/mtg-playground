"use client";

import { ChevronDownIcon } from "lucide-react";
import { useEffect, useState } from "react";

import { CardDetailLists } from "@/components/discovery/card-detail-lists";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  loadCardDetailLists,
  type CardDetailListsPack,
} from "@/lib/cards/actions";
import type { CardDetailView, PrintingFinish } from "@/lib/scryfall/card-printing";
import {
  buildCardDetailNavItems,
  buildCommanderDetailNavItems,
} from "@/lib/ui/detail-section-nav";
import { cn } from "@/lib/utils";

type CardDetailModalListsProps = {
  slug: string;
  cardId: string;
  oracleId: string;
  typeLine: string;
  isCommander: boolean;
  colorIdentity: string[];
  themes: string[];
  setCode: string | null;
  collectorNumber: string | null;
  finish: PrintingFinish;
};

/**
 * Lazy Related cards band — packs load only after the collapse opens.
 * Same As card / As commander + sticky TOC layout as the PDP (sheet density).
 */
export function CardDetailModalLists({
  slug,
  cardId,
  oracleId,
  typeLine,
  isCommander,
  colorIdentity,
  themes,
  setCode,
  collectorNumber,
  finish,
}: CardDetailModalListsProps) {
  const [open, setOpen] = useState(false);
  const [pack, setPack] = useState<CardDetailListsPack | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [syncedCardKey, setSyncedCardKey] = useState(`${cardId}|${oracleId}`);
  const [syncedNeedsLoad, setSyncedNeedsLoad] = useState(false);
  const [activeView, setActiveView] = useState<CardDetailView>("card");

  const cardKey = `${cardId}|${oracleId}`;
  const needsLoad = open && loadedKey !== cardKey;

  if (cardKey !== syncedCardKey) {
    setSyncedCardKey(cardKey);
    setPack(null);
    setLoadedKey(null);
    setLoading(false);
                setActiveView("card");
              }

  if (needsLoad !== syncedNeedsLoad) {
    setSyncedNeedsLoad(needsLoad);
    if (needsLoad) {
      setLoading(true);
    }
  }

  useEffect(() => {
    if (!needsLoad) return;

    let cancelled = false;
    void loadCardDetailLists({
      cardId,
      oracleId,
      typeLine,
      isCommander,
      colorIdentity,
      themes,
    }).then((next) => {
      if (cancelled) return;
      setPack(next);
      setLoadedKey(cardKey);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [
    needsLoad,
    cardKey,
    cardId,
    oracleId,
    typeLine,
    isCommander,
    colorIdentity,
    themes,
  ]);

  const hasAny =
    pack &&
    (pack.similar.length > 0 ||
      (pack.subtypes.length > 0 && pack.relatives.length > 0) ||
      pack.roleStaples.some((g) => g.cards.length > 0) ||
      pack.gameChangers.length > 0 ||
      pack.buildSkeleton.length > 0);

  const hasRelatives =
    Boolean(pack) && pack!.subtypes.length > 0 && pack!.relatives.length > 0;
  const roleStapleNav =
    pack?.roleStaples
      .filter((group) => group.cards.length > 0)
      .map((group) => ({ role: group.role, label: group.label })) ?? [];

  const sectionNavItems =
    activeView === "commander"
      ? buildCommanderDetailNavItems({
          roleStaples: roleStapleNav,
          hasGameChangers: (pack?.gameChangers.length ?? 0) > 0,
          hasBuildSkeleton: (pack?.buildSkeleton.length ?? 0) > 0,
        })
      : buildCardDetailNavItems({
          hasSimilarCards: (pack?.similar.length ?? 0) > 0,
          hasRelatives,
        });

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="border-t border-border/50 pt-4">
      <CollapsibleTrigger
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-lg py-1 text-left text-sm font-medium transition-colors hover:text-foreground",
          open ? "text-foreground" : "text-muted-foreground",
        )}
      >
        Related cards
        <ChevronDownIcon
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-4">
        {loading || !pack ? (
          <div className="space-y-3" aria-busy="true">
            <div className="h-4 w-40 animate-pulse rounded bg-muted" />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-[5/7] animate-pulse rounded-lg bg-muted"
                />
              ))}
            </div>
          </div>
        ) : !hasAny ? (
          <p className="text-sm text-muted-foreground">
            No related lists for this card yet.
          </p>
        ) : (
          <CardDetailLists
            slug={slug}
            isCommander={isCommander}
            activeView={isCommander ? activeView : "card"}
            setCode={setCode}
            collectorNumber={collectorNumber}
            finish={finish}
            sectionNavItems={sectionNavItems}
            similar={pack.similar}
            subtypes={pack.subtypes}
            relatives={pack.relatives}
            roleStaples={pack.roleStaples}
            gameChangers={pack.gameChangers}
            buildSkeleton={pack.buildSkeleton}
            variant="sheet"
            onViewChange={isCommander ? setActiveView : undefined}
          />
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
