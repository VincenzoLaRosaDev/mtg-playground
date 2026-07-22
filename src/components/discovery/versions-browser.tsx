"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { CardFaceTile } from "@/components/discovery/card-face-tile";
import { EntityPreviewFooter } from "@/components/discovery/entity-preview-footer";
import type { PrintingSelection } from "@/components/discovery/version-picker";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { siteContainerClassName, SHEET_LIST_RULE_CLASS } from "@/lib/ui/layout";
import {
  CARD_FACE_GRID_CLASS,
  CARD_PRINTING_TILE_BUTTON_CLASS,
  CARD_PRINTING_TILE_SELECTED_CLASS,
} from "@/lib/ui/card-face";
import {
  buildCardVersionHref,
  printingOptionLabel,
  type CardDetailView,
  type OraclePrintingOption,
  type PrintingFinish,
} from "@/lib/scryfall/card-printing";
import { cn } from "@/lib/utils";

type VersionsBrowserProps = {
  slug: string;
  printings: OraclePrintingOption[];
  selectedSet: string | null;
  selectedCn: string | null;
  selectedFinish: PrintingFinish | null;
  view?: CardDetailView | null;
  /**
   * When set, tile click calls this instead of navigating to `/cards/{slug}?…`.
   * Use in deck/collection embeds; omit on the public PDP.
   */
  onSelectPrinting?: (selection: PrintingSelection) => void;
  /** Hide the built-in trigger (host opens via controlled `open`). */
  hideTrigger?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function VersionsBrowser({
  slug,
  printings,
  selectedSet,
  selectedCn,
  selectedFinish,
  view = null,
  onSelectPrinting,
  hideTrigger = false,
  open: openProp,
  onOpenChange,
}: VersionsBrowserProps) {
  const router = useRouter();
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const controlled = openProp !== undefined;
  const open = controlled ? openProp : uncontrolledOpen;
  const setOpen = onOpenChange ?? setUncontrolledOpen;

  if (printings.length <= 1) {
    return null;
  }

  function selectPrinting(option: OraclePrintingOption) {
    const finish =
      selectedFinish && option.finishes.includes(selectedFinish)
        ? selectedFinish
        : null;

    setOpen(false);

    if (onSelectPrinting) {
      onSelectPrinting({
        set: option.setCode,
        cn: option.collectorNumber,
        finish,
      });
      return;
    }

    const href = buildCardVersionHref(slug, {
      set: option.setCode,
      cn: option.collectorNumber,
      finish,
      view: view === "commander" ? "commander" : null,
    });
    router.push(href);
    if (typeof window !== "undefined" && window.location.hash) {
      window.history.replaceState(null, "", href);
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {!hideTrigger ? (
        <SheetTrigger
          render={
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3 w-full sm:w-auto"
            />
          }
        >
          Show all versions
        </SheetTrigger>
      ) : null}

      <SheetContent
        side="bottom"
        className="max-h-[85dvh] gap-0 overflow-hidden p-0"
      >
        <SheetHeader
          className={cn(
            siteContainerClassName,
            "shrink-0 py-4",
            SHEET_LIST_RULE_CLASS,
          )}
        >
          <SheetTitle>All versions</SheetTitle>
          <SheetDescription>
            {printings.length.toLocaleString()} printings — pick one to open on this page.
          </SheetDescription>
        </SheetHeader>

        <div
          className={cn(
            siteContainerClassName,
            "min-h-0 flex-1 overflow-y-auto py-4 pb-8",
          )}
        >
          <ul className={CARD_FACE_GRID_CLASS}>
            {printings.map((option) => {
              const selected =
                selectedSet === option.setCode &&
                selectedCn === option.collectorNumber;
              const label = `${printingOptionLabel(option)} · ${option.setName}`;
              const preferredFinish =
                selectedFinish && option.finishes.includes(selectedFinish)
                  ? selectedFinish
                  : null;

              return (
                <li key={option.id}>
                  <button
                    type="button"
                    onClick={() => selectPrinting(option)}
                    className={cn(
                      CARD_PRINTING_TILE_BUTTON_CLASS,
                      selected && CARD_PRINTING_TILE_SELECTED_CLASS,
                    )}
                    aria-current={selected ? "true" : undefined}
                    aria-label={`Select version ${label}`}
                  >
                    <CardFaceTile
                      imageUri={option.imageUri}
                      faces={option.faces}
                      name={label}
                      footer={
                        <div className="space-y-1.5">
                          <p className="truncate text-xs font-medium text-foreground">
                            {label}
                          </p>
                          <EntityPreviewFooter
                            prices={option.prices}
                            preferredFinish={preferredFinish}
                            showInclusionRank={false}
                            frictionScore={null}
                          />
                        </div>
                      }
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </SheetContent>
    </Sheet>
  );
}
