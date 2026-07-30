"use client";

import { Search } from "lucide-react";
import { useState, type ReactNode } from "react";

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
import { siteContainerClassName } from "@/lib/ui/layout";
import { cn } from "@/lib/utils";

type WorkspaceSearchOverlayProps = {
  /** Called when the user picks a card from results (deck / collection host). */
  onAddCard: (card: GlobalSearchCardResult) => void;
  /** Optional secondary action under each hit. */
  onPeekCard?: (card: GlobalSearchCardResult) => void;
  /** Extra actions under each hit (e.g. qty). */
  renderCardActions?: (card: GlobalSearchCardResult) => ReactNode;
  /** When false, keep the sheet open after pick (host shows next step). */
  closeOnSelect?: boolean;
  title?: string;
  description?: string;
  triggerLabel?: string;
  className?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Hide the built-in trigger (host provides one). */
  hideTrigger?: boolean;
  /** Smaller trigger — matches the sticky Filters tongue row (collection Add). */
  compact?: boolean;
};

/**
 * Contextual catalog search for workspaces (deck editor, collection).
 * Shared tile-click list via WorkspaceSearchPanel; host handles the pick.
 */
export function WorkspaceSearchOverlay({
  onAddCard,
  onPeekCard,
  renderCardActions,
  closeOnSelect = true,
  title = "Add cards",
  description = "Search the catalog and add cards without leaving this page.",
  triggerLabel = "Search cards",
  className,
  open: openProp,
  onOpenChange,
  hideTrigger = false,
  compact = false,
}: WorkspaceSearchOverlayProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const controlled = openProp !== undefined;
  const open = controlled ? openProp : uncontrolledOpen;
  const setOpen = onOpenChange ?? setUncontrolledOpen;

  function handleSelect(card: GlobalSearchCardResult) {
    if (closeOnSelect) setOpen(false);
    onAddCard(card);
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {!hideTrigger ? (
        <SheetTrigger
          render={
            <Button
              type="button"
              variant="outline"
              size="default"
              className={cn(
                "gap-2",
                compact
                  ? "border-border bg-background text-foreground hover:bg-muted"
                  : null,
                className,
              )}
            />
          }
        >
          <Search className={compact ? "size-3.5" : "size-4"} aria-hidden />
          {triggerLabel}
        </SheetTrigger>
      ) : null}

      <SheetContent
        side="bottom"
        size="xl"
        className="max-h-[85dvh] gap-0 overflow-hidden p-0"
      >
        <SheetHeader
          className={cn(siteContainerClassName, "shrink-0 pb-0 pt-4 pr-12")}
        >
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>

        <div
          className={cn(siteContainerClassName, "flex min-h-0 flex-1 flex-col")}
        >
          <WorkspaceSearchPanel
            active={open}
            onSelectCard={handleSelect}
            onPeekCard={onPeekCard}
            renderCardActions={renderCardActions}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
