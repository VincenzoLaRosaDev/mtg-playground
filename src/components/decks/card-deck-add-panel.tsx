"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState, useTransition } from "react";

import { useSignInSheet } from "@/components/auth/sign-in-sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { upsertDeckCard } from "@/lib/decks/actions";
import type { DeckBoard } from "@/lib/decks/boards";
import { writeLastDeckId } from "@/lib/decks/last-deck";
import { maxCopiesForCard } from "@/lib/decks/legality";
import type { DeckPickerItem } from "@/lib/decks/decks";
import type { OracleDeckSnapshot } from "@/lib/decks/oracle-deck";
import type { PrintingFinish } from "@/lib/scryfall/card-printing";
import { QTY_INPUT_WIDTH_CLASS } from "@/lib/ui/qty-input";
import { LABEL_PRIMARY_CLASS, LABEL_OWNED_CLASS, STATUS_CHIP_CLASS } from "@/lib/ui/selection-chrome";
import { cn } from "@/lib/utils";

const FINISH_LABELS: Record<PrintingFinish, string> = {
  nonfoil: "Nonfoil",
  foil: "Foil",
  etched: "Etched",
};

export type CardDeckAddPanelProps = {
  cardId: string;
  typeLine: string;
  legalities: unknown;
  printingId: string | null;
  decks: DeckPickerItem[];
  selectedDeckId: string | null;
  onSelectedDeckIdChange: (deckId: string) => void;
  snapshot: OracleDeckSnapshot | null;
  /** When inspecting a row already in the selected deck. */
  activeDeckCardId?: string | null;
  onSelectDeckRow?: (row: {
    id: string;
    preferredPrintingId: string | null;
    finish: PrintingFinish | null;
  }) => void;
  onMutated?: () => void;
  /** Close parent after a successful add (workspace pages). */
  closeAfterAdd?: boolean;
  loading?: boolean;
  qtyInputId?: string;
  /** Called after a successful add (before optional close). */
  onAddSuccess?: () => void;
};

/**
 * Add-to-deck controls: deck select + qty + main/side + in-deck lines.
 */
export function CardDeckAddPanel({
  cardId,
  typeLine,
  legalities,
  printingId,
  decks,
  selectedDeckId,
  onSelectedDeckIdChange,
  snapshot,
  activeDeckCardId = null,
  onSelectDeckRow,
  onMutated,
  closeAfterAdd = false,
  loading = false,
  qtyInputId = "deck-add-qty",
  onAddSuccess,
}: CardDeckAddPanelProps) {
  const { data: session, status } = useSession();
  const { openSignIn } = useSignInSheet();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [qty, setQty] = useState("1");
  const [message, setMessage] = useState<string | null>(null);

  const callbackUrl =
    typeof window !== "undefined"
      ? `${window.location.pathname}${window.location.search}`
      : "/";

  if (status === "loading" || loading) {
    return (
      <div className="space-y-2" aria-busy="true">
        <div className="h-4 w-32 animate-pulse rounded bg-muted" />
        <div className="h-8 w-full animate-pulse rounded-lg bg-muted" />
        <div className="flex gap-2">
          <div className={cn(QTY_INPUT_WIDTH_CLASS, "h-8 animate-pulse rounded-lg bg-muted")} />
          <div className="h-8 w-28 animate-pulse rounded-lg bg-muted" />
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => openSignIn({ callbackUrl })}
      >
        Sign in to build decks
      </Button>
    );
  }

  if (decks.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        No decks yet.{" "}
        <Link href="/decks" className="underline-offset-2 hover:underline">
          Create one
        </Link>
        .
      </p>
    );
  }

  const selected =
    decks.find((d) => d.id === selectedDeckId) ?? decks[0] ?? null;
  const format = selected?.format ?? null;
  const deckQtyMax = format
    ? maxCopiesForCard({ format, typeLine, legalities })
    : undefined;
  const deckRows = snapshot?.rows ?? [];
  const deckTotal = snapshot?.totalQuantity ?? 0;

  const deckItems = decks.map((d) => ({
    value: d.id,
    label: `${d.name} · ${d.formatLabel}`,
  }));

  function parseQty(): number {
    const raw = Math.max(1, Math.floor(Number(qty)) || 1);
    if (deckQtyMax != null) return Math.min(raw, deckQtyMax);
    return raw;
  }

  function handleAddToBoard(board: DeckBoard) {
    if (!selected) return;
    const delta = parseQty();
    setMessage(null);
    startTransition(async () => {
      const result = await upsertDeckCard({
        deckId: selected.id,
        cardId,
        board,
        delta,
        preferredPrintingId: printingId,
      });
      if (!result.ok) {
        setMessage(result.error);
        return;
      }
      writeLastDeckId(selected.id);
      onAddSuccess?.();
      onMutated?.();
      if (closeAfterAdd) {
        router.refresh();
        return;
      }
      setMessage(
        board === "side" ? "Added to sideboard." : "Added to main.",
      );
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <label htmlFor={`${qtyInputId}-deck`} className="sr-only">
          Deck
        </label>
        <Select
          value={selected?.id}
          onValueChange={(next) => {
            if (next != null) onSelectedDeckIdChange(next);
          }}
          items={deckItems}
          disabled={pending}
        >
          <SelectTrigger id={`${qtyInputId}-deck`} className="w-full min-w-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="start">
            {deckItems.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className={cn(QTY_INPUT_WIDTH_CLASS, "shrink-0")}>
          <label htmlFor={qtyInputId} className="sr-only">
            Quantity
          </label>
          <Input
            id={qtyInputId}
            type="number"
            min={1}
            max={deckQtyMax}
            value={qty}
            disabled={pending}
            onChange={(e) => {
              const next = e.target.value;
              if (deckQtyMax != null && next !== "") {
                const n = Math.floor(Number(next));
                if (Number.isFinite(n) && n > deckQtyMax) {
                  setQty(String(deckQtyMax));
                  return;
                }
              }
              setQty(next);
            }}
            className="h-8 px-1 text-center tabular-nums"
          />
        </div>
        <Button
          type="button"
          size="default"
          disabled={pending || !selected}
          onClick={() => handleAddToBoard("main")}
        >
          Add to main
        </Button>
        <Button
          type="button"
          size="default"
          variant="secondary"
          disabled={pending || !selected}
          onClick={() => handleAddToBoard("side")}
        >
          Add to sideboard
        </Button>
      </div>

      {activeDeckCardId ? (
        <p className="text-xs text-muted-foreground">
          Selecting a version sets the preferred printing for this deck card.
        </p>
      ) : null}

      {message ? (
        <p className="text-xs text-muted-foreground" role="status">
          {message}
        </p>
      ) : null}

      {deckRows.length > 0 ? (
        <div className="space-y-1.5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            In this deck
            {deckTotal > 0 ? (
              <span className="ml-1 font-normal normal-case tracking-normal">
                · ×{deckTotal}
              </span>
            ) : null}
          </p>
          <ul className="space-y-1">
            {deckRows.map((row) => {
              const isActive = row.id === activeDeckCardId;
              const versionLabel =
                row.setCode && row.collectorNumber
                  ? `${row.setCode.toUpperCase()} #${row.collectorNumber}`
                  : "No preferred version";
              const content = (
                <>
                  <span className="font-medium">{row.boardLabel}</span>
                  <span className="tabular-nums">· {versionLabel}</span>
                  {row.finish && row.finish !== "nonfoil" ? (
                    <span>· {FINISH_LABELS[row.finish]}</span>
                  ) : null}
                  <span className={cn(STATUS_CHIP_CLASS, LABEL_PRIMARY_CLASS)}>
                    ×{row.quantity}
                  </span>
                  <span
                    className={cn(
                      STATUS_CHIP_CLASS,
                      row.missingQty > 0
                        ? "border border-destructive/45 bg-destructive/10 text-destructive"
                        : LABEL_OWNED_CLASS,
                    )}
                  >
                    {row.missingQty > 0
                      ? `Missing ×${row.missingQty}`
                      : `Owned ×${row.ownedQty}`}
                  </span>
                </>
              );

              return (
                <li key={row.id}>
                  {onSelectDeckRow ? (
                    <button
                      type="button"
                      onClick={() =>
                        onSelectDeckRow({
                          id: row.id,
                          preferredPrintingId: row.preferredPrintingId,
                          finish: row.finish,
                        })
                      }
                      className={cn(
                        "flex flex-wrap items-center gap-x-2 gap-y-0.5 text-left text-sm transition-colors hover:text-foreground",
                        isActive ? "text-foreground" : "text-muted-foreground",
                      )}
                    >
                      {content}
                    </button>
                  ) : (
                    <div
                      className={cn(
                        "flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm",
                        isActive ? "text-foreground" : "text-muted-foreground",
                      )}
                    >
                      {content}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">Not in this deck yet.</p>
      )}
    </div>
  );
}
