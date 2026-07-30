"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";

import { useCardDetailModal } from "@/components/discovery/card-detail-modal-provider";
import { CardFaceTile } from "@/components/discovery/card-face-tile";
import { PriceChip } from "@/components/discovery/price-chip";
import { WorkspaceSearchOverlay } from "@/components/discovery/workspace-search-overlay";
import { DeckImportPanel } from "@/components/decks/deck-import-panel";
import { DeckInsightsPanel } from "@/components/decks/deck-insights-panel";
import { DeckLegalityPanel } from "@/components/decks/deck-legality-panel";
import { DeckTokensExtrasSection } from "@/components/decks/deck-tokens-extras-section";
import {
  DECK_LIST_COLUMNS_CLASS,
  DeckCardList,
  DeckListBoardHeading,
  DeckListTypeSection,
} from "@/components/decks/deck-card-list";
import {
  DeckViewToggle,
  useDeckEditorView,
} from "@/components/decks/deck-view-toggle";
import { ListFilterAccess } from "@/components/layout/list-filter-access";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { addOwnedCopies } from "@/lib/collection/actions";
import {
  moveDeckCardBoard,
  removeDeckCard,
  setDeckCardQuantity,
  updateDeckMeta,
} from "@/lib/decks/actions";
import {
  boardLabel,
  formatDeckSizeLabel,
  sumDeckBoardQuantities,
  type DeckBoard,
} from "@/lib/decks/boards";
import {
  compareByCmcThenName,
  groupDeckCardsByType,
} from "@/lib/decks/card-type-groups";
import type { DeckCardView, DeckDetail } from "@/lib/decks/decks";
import { writeLastDeckId } from "@/lib/decks/last-deck";
import { maxCopiesForCard } from "@/lib/decks/legality";
import { SCRYFALL_BROWSE_FORMATS } from "@/lib/formats/scryfall-formats";
import type { GlobalSearchCardResult } from "@/lib/search/types";
import { CARD_FACE_GRID_CLASS } from "@/lib/ui/card-face";
import { QTY_INPUT_WIDTH_CLASS } from "@/lib/ui/qty-input";
import {
  LABEL_MISSING_CLASS,
  LABEL_OWNED_CLASS,
  STATUS_CHIP_CLASS,
} from "@/lib/ui/selection-chrome";
import { cn } from "@/lib/utils";

const formatItems = SCRYFALL_BROWSE_FORMATS.map((row) => ({
  value: row.value,
  label: row.label,
}));

/** Boards that get Goldfish-style type subsections (sideboard stays flat). */
const TYPE_GROUPED_BOARDS = new Set<DeckBoard>(["main"]);

type DeckEditorProps = {
  deck: DeckDetail;
};

function boardsForDeck(showCommanderBoards: boolean): DeckBoard[] {
  if (showCommanderBoards) {
    return ["commander", "companion", "main", "side"];
  }
  return ["main", "side"];
}

export function DeckEditor({ deck }: DeckEditorProps) {
  const router = useRouter();
  const { openCardDetail, setDeckWorkspace } = useCardDetailModal();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState(deck.name);
  const [format, setFormat] = useState(deck.format);
  const [view, setView] = useDeckEditorView();
  const [addSearchOpen, setAddSearchOpen] = useState(false);

  const boards = boardsForDeck(deck.showCommanderBoards);

  const refresh = useCallback(() => {
    router.refresh();
  }, [router]);

  useEffect(() => {
    writeLastDeckId(deck.id);
    setDeckWorkspace({
      deckId: deck.id,
      format: deck.format,
      onDeckMutated: refresh,
    });
    return () => setDeckWorkspace(null);
  }, [deck.id, deck.format, refresh, setDeckWorkspace]);

  function run(action: () => Promise<{ ok: true } | { ok: false; error: string }>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        setError(result.error);
        return;
      }
      refresh();
    });
  }

  function saveMeta(patch: { name?: string; format?: string }) {
    run(() => updateDeckMeta({ deckId: deck.id, ...patch }));
  }

  function openDeckCard(row: DeckCardView) {
    openCardDetail({
      oracleId: row.oracleId,
      slug: row.slug ?? undefined,
      preferredPrintingId: row.preferredPrintingId,
      initialSet: row.setCode,
      initialCn: row.collectorNumber,
      deckCardId: row.id,
      imageUri: row.imageUri,
      faces: row.faces,
    });
  }

  function onSearchPick(card: GlobalSearchCardResult) {
    openCardDetail({
      cardId: card.id,
      slug: card.slug ?? undefined,
      imageUri: card.imageUri,
      onSuccessfulAdd: () => setAddSearchOpen(false),
    });
  }

  const { ownedCopies, missingCopies } = deck.ownership;
  const sizeLabel = formatDeckSizeLabel(sumDeckBoardQuantities(deck.cards));

  return (
    <div className="space-y-6">
      <ListFilterAccess
        showFilterTongue={false}
        stickyActions={
          <WorkspaceSearchOverlay
            compact
            open={addSearchOpen}
            onOpenChange={setAddSearchOpen}
            closeOnSelect={false}
            onAddCard={onSearchPick}
            triggerLabel="Add cards"
            title="Add to deck"
            description="Search the catalog, then choose Add to main or Add to sideboard in the detail sheet."
          />
        }
      >
        <section className="flex flex-col gap-4 rounded-lg border border-border/60 bg-muted/15 p-4">
          <div className="grid items-end gap-4 sm:grid-cols-[minmax(0,1fr)_12rem] lg:grid-cols-[minmax(0,1fr)_12rem_auto]">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="editor-deck-name" className="text-sm font-medium">
                Name
              </label>
              <Input
                id="editor-deck-name"
                className="h-8"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => {
                  if (name.trim() && name.trim() !== deck.name) {
                    saveMeta({ name });
                  }
                }}
                disabled={pending}
                maxLength={80}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="editor-deck-format"
                className="text-sm font-medium"
              >
                Format
              </label>
              <Select
                value={format}
                onValueChange={(next) => {
                  if (next == null || next === format) return;
                  setFormat(next);
                  saveMeta({ format: next });
                }}
                items={formatItems}
                disabled={pending}
              >
                <SelectTrigger
                  id="editor-deck-format"
                  className="h-8 w-full min-w-0"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="start">
                  {formatItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2 lg:col-span-1">
              <span
                className="hidden text-sm font-medium text-transparent select-none lg:block"
                aria-hidden
              >
                Actions
              </span>
              <div className="flex h-8 items-center gap-3">
                <WorkspaceSearchOverlay
                  open={addSearchOpen}
                  onOpenChange={setAddSearchOpen}
                  closeOnSelect={false}
                  onAddCard={onSearchPick}
                  triggerLabel="Add cards"
                  title="Add to deck"
                  description="Search the catalog, then choose Add to main or Add to sideboard in the detail sheet."
                  className="h-8"
                />
                <DeckImportPanel deckId={deck.id} />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
            <span>{sizeLabel}</span>
            <span>
              Owned {ownedCopies} · Missing {missingCopies}
            </span>
            <span className="text-xs">
              Updated {new Date(deck.updatedAt).toLocaleString()}
            </span>
          </div>

          <DeckLegalityPanel
            ok={deck.legality.ok}
            issues={deck.legality.issues}
          />

          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
        </section>
      </ListFilterAccess>

      <div className="flex justify-end">
        <DeckViewToggle value={view} onChange={setView} />
      </div>

      {(() => {
        const shared = {
          format: deck.format,
          boards,
          pending,
          onPeek: openDeckCard,
          onQty: (row: DeckCardView, quantity: number) =>
            run(() =>
              setDeckCardQuantity({
                deckCardId: row.id,
                quantity,
              }),
            ),
          onRemove: (row: DeckCardView) => run(() => removeDeckCard(row.id)),
          onMove: (row: DeckCardView, nextBoard: DeckBoard) =>
            run(() =>
              moveDeckCardBoard({
                deckCardId: row.id,
                board: nextBoard,
              }),
            ),
          onCollectMissing: (row: DeckCardView) => {
            if (!row.preferredPrintingId || !row.finish) return;
            run(() =>
              addOwnedCopies({
                printingId: row.preferredPrintingId!,
                finish: row.finish!,
                delta: row.missingQty,
              }),
            );
          },
        };

        if (view === "list") {
          return (
            <div className={DECK_LIST_COLUMNS_CLASS}>
              {boards.map((board) => {
                const rows = deck.cards.filter((c) => c.board === board);
                if (rows.length === 0 && board !== "main") return null;
                const boardCount = rows.reduce(
                  (sum, row) => sum + row.quantity,
                  0,
                );
                const grouped = TYPE_GROUPED_BOARDS.has(board);

                return (
                  <div key={board} className="mb-2">
                    {rows.length === 0 ? (
                      <div className="mb-4 break-inside-avoid">
                        <DeckListBoardHeading
                          label={boardLabel(board)}
                          totalQuantity={boardCount}
                        />
                        <p className="text-sm text-muted-foreground">
                          No cards yet — use Add cards to start.
                        </p>
                      </div>
                    ) : grouped ? (
                      <>
                        <DeckListBoardHeading
                          label={boardLabel(board)}
                          totalQuantity={boardCount}
                        />
                        {groupDeckCardsByType(rows).map((group) => (
                          <DeckListTypeSection
                            key={group.id}
                            label={group.label}
                            totalQuantity={group.totalQuantity}
                          >
                            <DeckCardList
                              rows={group.cards}
                              format={shared.format}
                              boards={shared.boards}
                              pending={shared.pending}
                              onPeek={shared.onPeek}
                              onQty={shared.onQty}
                              onRemove={shared.onRemove}
                              onMove={shared.onMove}
                              onCollectMissing={shared.onCollectMissing}
                            />
                          </DeckListTypeSection>
                        ))}
                      </>
                    ) : (
                      /* Sideboard / commander / companion: flat list; heading sticks to first rows. */
                      <div className="mb-4">
                        <DeckListBoardHeading
                          label={boardLabel(board)}
                          totalQuantity={boardCount}
                        />
                        <DeckCardList
                          rows={[...rows].sort(compareByCmcThenName)}
                          format={shared.format}
                          boards={shared.boards}
                          pending={shared.pending}
                          onPeek={shared.onPeek}
                          onQty={shared.onQty}
                          onRemove={shared.onRemove}
                          onMove={shared.onMove}
                          onCollectMissing={shared.onCollectMissing}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        }

        return boards.map((board) => {
          const rows = deck.cards.filter((c) => c.board === board);
          if (rows.length === 0 && board !== "main") return null;
          const boardCount = rows.reduce((sum, row) => sum + row.quantity, 0);
          const grouped = TYPE_GROUPED_BOARDS.has(board);

          return (
            <section key={board} className="space-y-3">
              <h2 className="font-heading text-lg font-semibold">
                {boardLabel(board)}
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({boardCount})
                </span>
              </h2>
              {rows.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No cards yet — use Add cards to start.
                </p>
              ) : grouped ? (
                <div className="space-y-6">
                  {groupDeckCardsByType(rows).map((group) => (
                    <div key={group.id} className="space-y-2">
                      <h3 className="text-sm font-medium text-muted-foreground">
                        {group.label}
                        <span className="ml-1.5 font-normal tabular-nums">
                          ({group.totalQuantity})
                        </span>
                      </h3>
                      <DeckCardGrid rows={group.cards} {...shared} />
                    </div>
                  ))}
                </div>
              ) : (
                <DeckCardGrid
                  rows={[...rows].sort(compareByCmcThenName)}
                  {...shared}
                />
              )}
            </section>
          );
        });
      })()}

      <DeckInsightsPanel
        format={deck.format}
        insights={deck.insights}
        composition={deck.composition}
        curveBreakdowns={deck.curveBreakdowns}
        quantityBreakdowns={deck.quantityBreakdowns}
        cardNameQuantities={deck.cardNameQuantities}
        coherence={deck.coherence}
        estCost={deck.estCost}
        manaPips={deck.manaPips}
        manaProduction={deck.manaProduction}
        manaProductionLandsOnly={deck.manaProductionLandsOnly}
      />

      <DeckTokensExtrasSection tokensExtras={deck.tokensExtras} />
    </div>
  );
}

function DeckCardGrid({
  rows,
  format,
  boards,
  pending,
  onPeek,
  onQty,
  onRemove,
  onMove,
  onCollectMissing,
}: {
  rows: DeckCardView[];
  format: string;
  boards: DeckBoard[];
  pending: boolean;
  onPeek: (row: DeckCardView) => void;
  onQty: (row: DeckCardView, quantity: number) => void;
  onRemove: (row: DeckCardView) => void;
  onMove: (row: DeckCardView, board: DeckBoard) => void;
  onCollectMissing: (row: DeckCardView) => void;
}) {
  return (
    <ul className={CARD_FACE_GRID_CLASS}>
      {rows.map((row) => (
        <li key={row.id} className="min-w-0">
          <DeckCardTile
            row={row}
            format={format}
            boards={boards}
            pending={pending}
            onPeek={() => onPeek(row)}
            onQty={(quantity) => onQty(row, quantity)}
            onRemove={() => onRemove(row)}
            onMove={(board) => onMove(row, board)}
            onCollectMissing={() => onCollectMissing(row)}
          />
        </li>
      ))}
    </ul>
  );
}

function DeckCardTile({
  row,
  format,
  boards,
  pending,
  onPeek,
  onQty,
  onRemove,
  onMove,
  onCollectMissing,
}: {
  row: DeckCardView;
  format: string;
  boards: DeckBoard[];
  pending: boolean;
  onPeek: () => void;
  onQty: (quantity: number) => void;
  onRemove: () => void;
  onMove: (board: DeckBoard) => void;
  onCollectMissing: () => void;
}) {
  const missing = row.missingQty > 0;
  const canCollectMissing =
    missing && row.preferredPrintingId != null && row.finish != null;
  const qtyMax = maxCopiesForCard({
    format,
    typeLine: row.typeLine,
    legalities: row.legalities,
  });

  return (
    <CardFaceTile
      href={row.slug ? `/cards/${row.slug}` : null}
      onOpen={onPeek}
      imageUri={row.imageUri}
      faces={row.faces}
      name={row.name}
      finish={row.finish}
      footer={
        <div className="space-y-2">
          <div className="flex min-w-0 flex-wrap items-center justify-between gap-x-2 gap-y-1">
            <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
              <PriceChip
                prices={row.prices}
                preferredFinish={row.finish}
                mode="finish"
                className="min-w-0"
              />
              {row.setCode && row.collectorNumber ? (
                <span className="min-w-0 truncate text-xs text-muted-foreground">
                  {row.setCode.toUpperCase()} #{row.collectorNumber}
                </span>
              ) : null}
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <span
                className={cn(
                  STATUS_CHIP_CLASS,
                  missing ? LABEL_MISSING_CLASS : LABEL_OWNED_CLASS,
                )}
              >
                {missing
                  ? `Missing ×${row.missingQty}`
                  : `Owned ×${row.ownedQty}`}
              </span>
              {canCollectMissing ? (
                <Button
                  type="button"
                  size="xs"
                  disabled={pending}
                  title={`Add ×${row.missingQty} to collection`}
                  className={cn(
                    STATUS_CHIP_CLASS,
                    "h-5 gap-0 rounded-md px-1.5 text-[10px] leading-none",
                  )}
                  onClick={onCollectMissing}
                >
                  +×{row.missingQty}
                </Button>
              ) : null}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <Input
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
                onQty(next);
              }}
              aria-label={`Quantity for ${row.name} (max ${qtyMax})`}
            />
            {boards.length > 1 ? (
              <Select
                value={row.board}
                onValueChange={(next) => {
                  if (next != null && next !== row.board) {
                    onMove(next as DeckBoard);
                  }
                }}
                items={boards.map((b) => ({ value: b, label: boardLabel(b) }))}
                disabled={pending}
              >
                <SelectTrigger
                  className="h-6 min-h-6 w-auto min-w-0 max-w-28 gap-1 rounded-[min(var(--radius-md),10px)] px-2 py-0 text-xs data-[size=sm]:h-6 data-[size=sm]:min-h-6 [&_svg]:size-3"
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
              className="text-destructive hover:text-destructive"
              disabled={pending}
              onClick={onRemove}
            >
              <Icon icon={Trash2} size="sm" />
              Remove
            </Button>
          </div>
        </div>
      }
    />
  );
}
