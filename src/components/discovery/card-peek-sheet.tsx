"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { CardMultifaceImage } from "@/components/discovery/card-multiface-image";
import { ClassificationBadges } from "@/components/discovery/classification-badges";
import { DetailHeroMeta } from "@/components/discovery/detail-hero-meta";
import { EntityPreviewFooter } from "@/components/discovery/entity-preview-footer";
import { VersionPicker, type PrintingSelection } from "@/components/discovery/version-picker";
import { VersionsBrowser } from "@/components/discovery/versions-browser";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { CardClassificationSummary } from "@/lib/discovery/detail-pack";
import type { CardFaceImage } from "@/lib/scryfall/faces";
import {
  buildCardVersionHref,
  type OraclePrintingOption,
  type PrintingFinish,
} from "@/lib/scryfall/card-printing";
import { cn } from "@/lib/utils";

export type CardPeekData = {
  slug: string;
  name: string;
  typeLine: string;
  imageUri: string | null;
  faces?: CardFaceImage[] | null;
  popularityRank: number | null;
  frictionScore: number;
  isGameChanger: boolean;
  isReserved: boolean;
  isCommander: boolean;
  classification: CardClassificationSummary | null;
  printings: OraclePrintingOption[];
  selectedSet: string | null;
  selectedCn: string | null;
  selectedFinish: PrintingFinish | null;
  prices: unknown;
};

type CardPeekSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  card: CardPeekData | null;
  /** Preferred printing change inside the workspace (no URL navigation). */
  onSelectPrinting: (selection: PrintingSelection) => void;
  /** Host actions: Add, qty, legality, etc. */
  actions?: ReactNode;
  className?: string;
};

/**
 * Compact card inspect overlay for workspaces (deck editor).
 * Printing controls use callback mode; “Open full page” escapes to the catalog PDP.
 */
export function CardPeekSheet({
  open,
  onOpenChange,
  card,
  onSelectPrinting,
  actions,
  className,
}: CardPeekSheetProps) {
  const fullPageHref = card
    ? buildCardVersionHref(card.slug, {
        set: card.selectedSet,
        cn: card.selectedCn,
        finish: card.selectedFinish,
      })
    : "#";

  const activeFinish =
    card?.selectedFinish &&
    card.printings
      .find(
        (row) =>
          row.setCode === card.selectedSet &&
          row.collectorNumber === card.selectedCn,
      )
      ?.finishes.includes(card.selectedFinish)
      ? card.selectedFinish
      : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className={cn("max-h-[90dvh] gap-0 overflow-hidden p-0", className)}
      >
        {card ? (
          <>
            <SheetHeader className="shrink-0 border-b border-border px-4 py-4 sm:px-6">
              <SheetTitle>{card.name}</SheetTitle>
              <SheetDescription>{card.typeLine}</SheetDescription>
            </SheetHeader>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6">
              <div className="grid gap-6 sm:grid-cols-[minmax(0,11rem)_minmax(0,1fr)] sm:items-start">
                <div className="mx-auto w-full max-w-[11rem] sm:mx-0">
                  <CardMultifaceImage
                    imageUri={card.imageUri}
                    faces={card.faces}
                    name={card.name}
                    variant="grid"
                    finish={activeFinish}
                  />
                </div>

                <div className="min-w-0 space-y-4">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Status
                    </p>
                    <DetailHeroMeta
                      popularityRank={card.popularityRank}
                      frictionScore={card.frictionScore}
                      isGameChanger={card.isGameChanger}
                      isReserved={card.isReserved}
                      isCommander={card.isCommander}
                    />
                  </div>

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Printing
                    </p>
                    <div className="mt-2 space-y-2">
                      <VersionPicker
                        slug={card.slug}
                        printings={card.printings}
                        selectedSet={card.selectedSet}
                        selectedCn={card.selectedCn}
                        selectedFinish={card.selectedFinish}
                        layout="overview"
                        onSelectPrinting={onSelectPrinting}
                      />
                      <VersionsBrowser
                        slug={card.slug}
                        printings={card.printings}
                        selectedSet={card.selectedSet}
                        selectedCn={card.selectedCn}
                        selectedFinish={card.selectedFinish}
                        onSelectPrinting={onSelectPrinting}
                      />
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Market
                    </p>
                    <div className="mt-2">
                      <EntityPreviewFooter
                        prices={card.prices}
                        preferredFinish={activeFinish}
                        showInclusionRank={false}
                        frictionScore={null}
                        className="gap-x-3 gap-y-2 text-sm"
                      />
                    </div>
                  </div>

                  <ClassificationBadges classification={card.classification} />

                  {actions ? <div className="flex flex-wrap gap-2 pt-1">{actions}</div> : null}

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full sm:w-auto"
                    nativeButton={false}
                    render={<Link href={fullPageHref} />}
                  >
                    Open full page
                  </Button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="px-4 py-8 text-sm text-muted-foreground">No card selected.</div>
        )}
      </SheetContent>
    </Sheet>
  );
}
