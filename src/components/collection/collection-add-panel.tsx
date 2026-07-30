"use client";

import { Search } from "lucide-react";
import { useState } from "react";

import { useCardDetailModal } from "@/components/discovery/card-detail-modal-provider";
import { WorkspaceSearchPanel } from "@/components/discovery/workspace-search-panel";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { GlobalSearchCardResult } from "@/lib/search/types";
import { siteContainerClassName, SHEET_LIST_RULE_CLASS } from "@/lib/ui/layout";
import { cn } from "@/lib/utils";

/** Bottom sheets leave page visible above for dismiss. */
const BOTTOM_SHEET_MAX_CLASS = "max-h-[85dvh]";

type CollectionAddPanelProps = {
  /** Smaller trigger — matches the sticky Filters tongue's text size. */
  compact?: boolean;
};

/**
 * Collection add: search overlay → unified card detail modal (version grid + CTAs).
 */
export function CollectionAddPanel({ compact = false }: CollectionAddPanelProps) {
  const { openCardDetail } = useCardDetailModal();
  const [open, setOpen] = useState(false);

  function selectCard(card: GlobalSearchCardResult) {
    setOpen(false);
    openCardDetail({
      mode: "collection",
      cardId: card.id,
      slug: card.slug ?? undefined,
      imageUri: card.imageUri,
    });
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="default"
            className={cn(
              "gap-2",
              compact ? "bg-background hover:bg-muted text-foreground border-border" : "",
            )}
          />
        }
      >
        <Search className={compact ? "size-3.5" : "size-4"} aria-hidden />
        Add cards
      </SheetTrigger>

      <SheetContent
        side="bottom"
        size="xl"
        className={cn(BOTTOM_SHEET_MAX_CLASS, "flex flex-col gap-0 overflow-hidden p-0")}
      >
        <SheetHeader
          className={cn(siteContainerClassName, "shrink-0 pb-0 pt-4 pr-12")}
        >
          <SheetTitle>Add to collection</SheetTitle>
          <SheetDescription>
            Search a card, then pick a printing and finish in the detail sheet.
          </SheetDescription>
          <div className={SHEET_LIST_RULE_CLASS} />
        </SheetHeader>
        <div className={cn(siteContainerClassName, "min-h-0 flex-1 overflow-y-auto py-4")}>
          <WorkspaceSearchPanel
            active={open}
            onSelectCard={selectCard}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
