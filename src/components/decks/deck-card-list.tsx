"use client";

import type { ReactNode } from "react";

import { CardNameWithHoverPreview } from "@/components/discovery/card-hover-preview";
import { PriceChip } from "@/components/discovery/price-chip";
import { ManaCost } from "@/components/mtg/mana-cost";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { boardLabel, type DeckBoard } from "@/lib/decks/boards";
import type { DeckCardView } from "@/lib/decks/decks";
import { maxCopiesForCard } from "@/lib/decks/legality";
import { QTY_INPUT_WIDTH_CLASS } from "@/lib/ui/qty-input";
import {
  LABEL_MUTED_CLASS,
  STATUS_CHIP_CLASS,
} from "@/lib/ui/selection-chrome";
import { cn } from "@/lib/utils";

/** Multi-column flow for Goldfish-style list sections. */
export const DECK_LIST_COLUMNS_CLASS =
  "columns-1 gap-x-6 sm:columns-2 xl:columns-3";

export type DeckCardListCallbacks = {
  format: string;
  boards: DeckBoard[];
  pending: boolean;
  onPeek: (row: DeckCardView) => void;
  onQty: (row: DeckCardView, quantity: number) => void;
  onRemove: (row: DeckCardView) => void;
  onMove: (row: DeckCardView, board: DeckBoard) => void;
};

type DeckCardListProps = DeckCardListCallbacks & {
  rows: DeckCardView[];
  /** When true, wrap rows in multi-column flow (flat commander/companion lists). */
  multiColumn?: boolean;
};

export function DeckCardList({
  rows,
  multiColumn = false,
  ...callbacks
}: DeckCardListProps) {
  const list = (
    <ul className="space-y-0.5">
      {rows.map((row) => (
        <li key={row.id} className="break-inside-avoid">
          <DeckCardListRow row={row} {...callbacks} />
        </li>
      ))}
    </ul>
  );

  if (!multiColumn) return list;

  return <div className={DECK_LIST_COLUMNS_CLASS}>{list}</div>;
}

type DeckCardListRowProps = DeckCardListCallbacks & {
  row: DeckCardView;
};

function DeckCardListRow({
  row,
  format,
  boards,
  pending,
  onPeek,
  onQty,
  onRemove,
  onMove,
}: DeckCardListRowProps) {
  const missing = row.missingQty > 0;
  const qtyMax = maxCopiesForCard({
    format,
    typeLine: row.typeLine,
    legalities: row.legalities,
  });

  return (
    <div className="flex min-w-0 items-center gap-1.5 py-0.5 text-sm">
      <label className="sr-only" htmlFor={`list-qty-${row.id}`}>
        Quantity for {row.name}
      </label>
      <Input
        id={`list-qty-${row.id}`}
        type="number"
        min={1}
        max={qtyMax}
        className={cn(
          QTY_INPUT_WIDTH_CLASS,
          "h-6 shrink-0 rounded-[min(var(--radius-md),10px)] px-1 text-center text-xs tabular-nums md:text-xs",
        )}
        defaultValue={Math.min(row.quantity, qtyMax)}
        key={`${row.id}-${row.quantity}-${qtyMax}`}
        disabled={pending}
        onBlur={(e) => {
          let next = Math.floor(Number(e.target.value));
          if (!Number.isFinite(next)) return;
          next = Math.min(qtyMax, Math.max(1, next));
          if (next === row.quantity) {
            e.target.value = String(row.quantity);
            return;
          }
          e.target.value = String(next);
          onQty(row, next);
        }}
      />
      <CardNameWithHoverPreview
        name={row.name}
        imageUri={row.imageUri}
        faces={row.faces}
        onOpen={() => onPeek(row)}
        className="min-w-0 flex-1 basis-24"
      />
      <ManaCost cost={row.manaCost} size="xs" className="shrink-0" />
      <span
        className={cn(
          STATUS_CHIP_CLASS,
          "hidden shrink-0 md:inline-flex",
          missing
            ? "border border-warning bg-warning/15 text-warning-foreground"
            : LABEL_MUTED_CLASS,
        )}
      >
        {missing ? `Missing ×${row.missingQty}` : `Owned ×${row.ownedQty}`}
      </span>
      <PriceChip
        prices={row.prices}
        preferredFinish={row.finish}
        mode="finish"
        className="ml-auto hidden shrink-0 lg:inline-flex"
      />
      {boards.length > 1 ? (
        <Select
          value={row.board}
          onValueChange={(next) => {
            if (next != null && next !== row.board) {
              onMove(row, next as DeckBoard);
            }
          }}
          items={boards.map((b) => ({ value: b, label: boardLabel(b) }))}
          disabled={pending}
        >
          <SelectTrigger
            className="h-6 min-h-6 w-auto min-w-0 max-w-24 gap-1 rounded-[min(var(--radius-md),10px)] px-1.5 py-0 text-xs data-[size=sm]:h-6 data-[size=sm]:min-h-6 [&_svg]:size-3"
            size="sm"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="end">
            {boards.map((b) => (
              <SelectItem key={b} value={b}>
                {boardLabel(b)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}
      <Button
        type="button"
        variant="ghost"
        size="xs"
        className="shrink-0 text-destructive hover:text-destructive"
        disabled={pending}
        onClick={() => onRemove(row)}
      >
        Remove
      </Button>
    </div>
  );
}

/** Type-group block that stays intact inside CSS multi-column flow. */
export function DeckListTypeSection({
  label,
  totalQuantity,
  children,
}: {
  label: string;
  totalQuantity: number;
  children: ReactNode;
}) {
  return (
    <div className="mb-4 break-inside-avoid">
      <h3 className="mb-1.5 text-sm font-medium text-muted-foreground">
        {label}
        <span className="ml-1.5 font-normal tabular-nums">
          ({totalQuantity})
        </span>
      </h3>
      {children}
    </div>
  );
}

/** Board header inside the shared list multi-column flow (Main / Side continuous). */
export function DeckListBoardHeading({
  label,
  totalQuantity,
}: {
  label: string;
  totalQuantity: number;
}) {
  return (
    <h2 className="mb-3 break-inside-avoid font-heading text-lg font-semibold">
      {label}
      <span className="ml-2 text-sm font-normal text-muted-foreground">
        ({totalQuantity})
      </span>
    </h2>
  );
}
