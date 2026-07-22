"use client";

import { ChevronDown, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { CardFaceTile } from "@/components/discovery/card-face-tile";
import { EntityPreviewFooter } from "@/components/discovery/entity-preview-footer";
import { CardGridSkeleton } from "@/components/discovery/loading-skeletons";
import { WorkspaceSearchPanel } from "@/components/discovery/workspace-search-panel";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  addOwnedCopies,
  getPrintingsByCardId,
  upsertCollectionItem,
} from "@/lib/collection/actions";
import type { GlobalSearchCardResult } from "@/lib/search/types";
import {
  parsePrintingFinish,
  printingOptionLabel,
  type OraclePrintingOption,
  type PrintingFinish,
} from "@/lib/scryfall/card-printing";
import {
  CARD_FACE_GRID_CLASS,
  CARD_PRINTING_TILE_BUTTON_CLASS,
  CARD_PRINTING_TILE_SELECTED_CLASS,
} from "@/lib/ui/card-face";
import { siteContainerClassName, SHEET_LIST_RULE_CLASS } from "@/lib/ui/layout";
import { cn } from "@/lib/utils";

/** Bottom sheets leave page visible above for dismiss — match VersionsBrowser. */
const BOTTOM_SHEET_MAX_CLASS = "max-h-[85dvh]";

/**
 * Desktop (md+) with fine pointer: actions in the header.
 * Mobile / coarse pointer: sticky footer (thumb reach).
 */
const SHEET_ACTIONS_IN_HEADER_CLASS = "hidden md:pointer-fine:flex";
const SHEET_ACTIONS_IN_FOOTER_CLASS = "flex md:pointer-fine:hidden";

type DraftSelection = {
  card: GlobalSearchCardResult;
  printings: OraclePrintingOption[];
  printingId: string;
};

type Step =
  | { kind: "search" }
  | { kind: "resolving"; card: GlobalSearchCardResult }
  | { kind: "printing"; draft: DraftSelection };

type AddIntent = "owned" | "wantlist";

function printingFinishes(printing: OraclePrintingOption): PrintingFinish[] {
  return printing.finishes
    .map((value) => parsePrintingFinish(value))
    .filter((value): value is PrintingFinish => value != null);
}

function finishLabel(finish: PrintingFinish): string {
  if (finish === "nonfoil") return "Nonfoil";
  if (finish === "foil") return "Foil";
  return "Etched";
}

export function CollectionAddPanel() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>({ kind: "search" });
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState("1");

  const draft = step.kind === "printing" ? step.draft : null;
  const resolvingCard = step.kind === "resolving" ? step.card : null;
  const activePrinting =
    draft?.printings.find((printing) => printing.id === draft.printingId) ?? null;
  const finishes = activePrinting ? printingFinishes(activePrinting) : [];
  const onPrintingStep = step.kind === "printing" || step.kind === "resolving";
  const onSearchStep = step.kind === "search";
  const parsedQuantity = Math.max(1, Math.floor(Number(quantity)) || 1);

  function resetQuantity() {
    setQuantity("1");
  }

  function goToSearch() {
    setError(null);
    resetQuantity();
    setStep({ kind: "search" });
  }

  function handleOpenChange(next: boolean) {
    if (!next) {
      if (onPrintingStep) {
        goToSearch();
        return;
      }
      setOpen(false);
      setStep({ kind: "search" });
      setError(null);
      resetQuantity();
      return;
    }
    setOpen(true);
  }

  function selectCard(card: GlobalSearchCardResult) {
    setError(null);
    resetQuantity();
    setStep({ kind: "resolving", card });
    startTransition(async () => {
      const printings = await getPrintingsByCardId(card.id);
      if (!printings || printings.length === 0) {
        setError("No printings found for that card.");
        setStep({ kind: "search" });
        return;
      }
      setStep({
        kind: "printing",
        draft: {
          card,
          printings,
          printingId: printings[0]!.id,
        },
      });
    });
  }

  function commitAdd(intent: AddIntent, finish: PrintingFinish) {
    if (!draft) return;
    setError(null);
    const qty = parsedQuantity;
    setQuantity(String(qty));
    startTransition(async () => {
      const result =
        intent === "owned"
          ? await addOwnedCopies({
              printingId: draft.printingId,
              finish,
              delta: qty,
            })
          : await upsertCollectionItem({
              printingId: draft.printingId,
              finish,
              quantity: 1,
              wantlist: true,
            });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setOpen(false);
      setStep({ kind: "search" });
      resetQuantity();
      router.refresh();
    });
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger render={<Button type="button" variant="outline" className="gap-2" />}>
        <Search className="size-4" aria-hidden />
        Add cards
      </SheetTrigger>

      <SheetContent
        side="bottom"
        showCloseButton={!onPrintingStep}
        className={cn(BOTTOM_SHEET_MAX_CLASS, "flex flex-col gap-0 overflow-hidden p-0")}
      >
        {/* Keep search mounted so query/results survive back navigation. */}
        <div className={cn("flex min-h-0 flex-1 flex-col", !onSearchStep && "hidden")}>
          <SheetHeader
            className={cn(siteContainerClassName, "shrink-0 pb-0 pt-4 pr-12")}
          >
            <SheetTitle>Add to collection</SheetTitle>
            <SheetDescription>
              Search a card, pick a printing, then add — choose finish only when needed.
            </SheetDescription>
          </SheetHeader>
          <div className={cn(siteContainerClassName, "flex min-h-0 flex-1 flex-col")}>
            <WorkspaceSearchPanel
              active={open && onSearchStep}
              pickMode="tile"
              onSelectCard={selectCard}
            />
          </div>
        </div>

        {resolvingCard ? (
          <>
            <SheetHeader
              className={cn(
                siteContainerClassName,
                "shrink-0 py-4",
                SHEET_LIST_RULE_CLASS,
              )}
            >
              <SheetTitle>{resolvingCard.name}</SheetTitle>
              <SheetDescription>Loading printings…</SheetDescription>
              <BackToSearchButton onClick={goToSearch} />
            </SheetHeader>
            <div
              className={cn(siteContainerClassName, "min-h-0 flex-1 overflow-y-auto py-4 pb-8")}
            >
              <CardGridSkeleton count={10} />
            </div>
          </>
        ) : null}

        {draft ? (
          <>
            <SheetHeader
              className={cn(
                siteContainerClassName,
                "shrink-0 py-4",
                SHEET_LIST_RULE_CLASS,
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <SheetTitle>{draft.card.name}</SheetTitle>
                  <SheetDescription>
                    Choose set / collector number, set quantity, then add owned or to wish.
                  </SheetDescription>
                  <BackToSearchButton onClick={goToSearch} />
                  {error ? (
                    <p className="mt-2 hidden text-sm text-destructive md:pointer-fine:block">
                      {error}
                    </p>
                  ) : null}
                </div>

                <div
                  className={cn(
                    SHEET_ACTIONS_IN_HEADER_CLASS,
                    "shrink-0 flex-wrap items-center gap-2",
                  )}
                >
                  <QuantityField
                    id="collection-add-qty-header"
                    value={quantity}
                    pending={pending}
                    onChange={setQuantity}
                  />
                  <AddActionButtons
                    finishes={finishes}
                    pending={pending}
                    onPick={commitAdd}
                  />
                </div>
              </div>
            </SheetHeader>

            <div
              className={cn(siteContainerClassName, "min-h-0 flex-1 overflow-y-auto py-4 pb-8")}
            >
              <ul className={CARD_FACE_GRID_CLASS}>
                {draft.printings.map((printing) => {
                  const selected = printing.id === draft.printingId;
                  const label = `${printingOptionLabel(printing)} · ${printing.setName}`;
                  const available = printingFinishes(printing);
                  const finishHint =
                    available.length > 0
                      ? available.map((finish) => finishLabel(finish)).join(" · ")
                      : null;

                  return (
                    <li key={printing.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setStep({
                            kind: "printing",
                            draft: {
                              ...draft,
                              printingId: printing.id,
                            },
                          });
                        }}
                        className={cn(
                          CARD_PRINTING_TILE_BUTTON_CLASS,
                          selected && CARD_PRINTING_TILE_SELECTED_CLASS,
                        )}
                        aria-current={selected ? "true" : undefined}
                        aria-label={`Select version ${label}`}
                      >
                        <CardFaceTile
                          imageUri={printing.imageUri}
                          faces={printing.faces}
                          name={label}
                          footer={
                            <div className="space-y-1.5 text-sm">
                              <div className="min-w-0">
                                <p className="line-clamp-2 font-medium">{draft.card.name}</p>
                                <p className="truncate text-xs text-muted-foreground">
                                  {printing.setCode.toUpperCase()} #{printing.collectorNumber}
                                  {finishHint ? ` · ${finishHint}` : ""}
                                </p>
                              </div>
                              <EntityPreviewFooter
                                prices={printing.prices}
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

            <div
              className={cn(
                siteContainerClassName,
                SHEET_ACTIONS_IN_FOOTER_CLASS,
                "shrink-0 flex-col gap-3 border-t border-border py-4",
              )}
            >
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
              <div className="flex flex-wrap items-center gap-2">
                <QuantityField
                  id="collection-add-qty-footer"
                  value={quantity}
                  pending={pending}
                  onChange={setQuantity}
                />
                <AddActionButtons
                  finishes={finishes}
                  pending={pending}
                  onPick={commitAdd}
                />
              </div>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function BackToSearchButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      type="button"
      variant="link"
      size="sm"
      className="mt-1 h-auto px-0 text-muted-foreground"
      onClick={onClick}
    >
      Back to search
    </Button>
  );
}

function QuantityField({
  id,
  value,
  pending,
  onChange,
}: {
  id: string;
  value: string;
  pending: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <label htmlFor={id} className="text-xs font-medium text-muted-foreground">
        Qty
      </label>
      <Input
        id={id}
        type="number"
        min={1}
        inputMode="numeric"
        className="h-7 w-16"
        value={value}
        disabled={pending}
        onChange={(event) => onChange(event.target.value)}
        onBlur={() => {
          const next = Math.max(1, Math.floor(Number(value)) || 1);
          onChange(String(next));
        }}
      />
    </div>
  );
}

function AddActionButtons({
  finishes,
  pending,
  onPick,
}: {
  finishes: PrintingFinish[];
  pending: boolean;
  onPick: (intent: AddIntent, finish: PrintingFinish) => void;
}) {
  return (
    <>
      <FinishAwareAddButton
        label="Add owned"
        intent="owned"
        finishes={finishes}
        pending={pending}
        onPick={onPick}
      />
      <FinishAwareAddButton
        label="Add to wish"
        intent="wantlist"
        variant="outline"
        finishes={finishes}
        pending={pending}
        onPick={onPick}
      />
    </>
  );
}

function FinishAwareAddButton({
  label,
  intent,
  finishes,
  pending,
  onPick,
  variant = "default",
}: {
  label: string;
  intent: AddIntent;
  finishes: PrintingFinish[];
  pending: boolean;
  onPick: (intent: AddIntent, finish: PrintingFinish) => void;
  variant?: "default" | "outline";
}) {
  const onlyFinish = finishes.length === 1 ? finishes[0] : null;

  if (onlyFinish || finishes.length === 0) {
    return (
      <Button
        type="button"
        size="sm"
        variant={variant}
        disabled={pending || finishes.length === 0}
        onClick={() => {
          if (onlyFinish) onPick(intent, onlyFinish);
        }}
      >
        {label}
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={pending}
        render={<Button type="button" size="sm" variant={variant} className="gap-1" />}
      >
        {label}
        <ChevronDown className="size-3.5 opacity-70" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-40">
        {finishes.map((finish) => (
          <DropdownMenuItem
            key={finish}
            className="cursor-pointer"
            onClick={() => onPick(intent, finish)}
          >
            {finishLabel(finish)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
