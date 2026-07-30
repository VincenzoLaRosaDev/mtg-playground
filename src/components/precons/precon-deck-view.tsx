"use client";

import { useCardDetailModal } from "@/components/discovery/card-detail-modal-provider";
import { CardFaceTile } from "@/components/discovery/card-face-tile";
import { CardNameWithHoverPreview } from "@/components/discovery/card-hover-preview";
import { PriceChip } from "@/components/discovery/price-chip";
import {
  DECK_LIST_COLUMNS_CLASS,
  DeckListBoardHeading,
  DeckListTypeSection,
} from "@/components/decks/deck-card-list";
import {
  DeckViewToggle,
  usePreconDeckView,
} from "@/components/decks/deck-view-toggle";
import { ManaCost } from "@/components/mtg/mana-cost";
import {
  boardLabel,
  type DeckBoard,
} from "@/lib/decks/boards";
import {
  compareByCmcThenName,
  groupDeckCardsByType,
} from "@/lib/decks/card-type-groups";
import type { PreconCardView } from "@/lib/precons/precons";
import { CARD_FACE_GRID_CLASS } from "@/lib/ui/card-face";
import {
  LABEL_MISSING_CLASS,
  LABEL_OWNED_CLASS,
  STATUS_CHIP_CLASS,
} from "@/lib/ui/selection-chrome";
import { cn } from "@/lib/utils";

/** Boards that get Goldfish-style type subsections (sideboard stays flat). */
const TYPE_GROUPED_BOARDS = new Set<DeckBoard>(["main"]);

function boardsForPrecon(showCommanderBoards: boolean): DeckBoard[] {
  return showCommanderBoards
    ? ["commander", "companion", "main", "side"]
    : ["main", "side"];
}

type PreconDeckViewProps = {
  cards: PreconCardView[];
  showCommanderBoards: boolean;
  signedIn: boolean;
};

export function PreconDeckView({
  cards,
  showCommanderBoards,
  signedIn,
}: PreconDeckViewProps) {
  const [view, setView] = usePreconDeckView();
  const { openCardDetail } = useCardDetailModal();
  const boards = boardsForPrecon(showCommanderBoards);

  function openRow(row: PreconCardView) {
    openCardDetail({
      oracleId: row.oracleId,
      slug: row.slug ?? undefined,
      preferredPrintingId: row.preferredPrintingId,
      initialSet: row.setCode,
      initialCn: row.collectorNumber,
      imageUri: row.imageUri,
    });
  }

  if (cards.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No cards in this precon.</p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <DeckViewToggle value={view} onChange={setView} />
      </div>

      {view === "list" ? (
        <div className={DECK_LIST_COLUMNS_CLASS}>
          {boards.map((board) => {
            const rows = cards.filter((c) => c.board === board);
            if (rows.length === 0) return null;
            const boardCount = rows.reduce((sum, row) => sum + row.quantity, 0);
            const grouped = TYPE_GROUPED_BOARDS.has(board);

            if (grouped) {
              return (
                <div key={board} className="mb-2">
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
                      <PreconCardListRows
                        rows={group.cards}
                        signedIn={signedIn}
                        onPeek={openRow}
                      />
                    </DeckListTypeSection>
                  ))}
                </div>
              );
            }

            return (
              <div key={board} className="mb-2">
                <DeckListBoardHeading
                  label={boardLabel(board)}
                  totalQuantity={boardCount}
                />
                <PreconCardListRows
                  rows={[...rows].sort(compareByCmcThenName)}
                  signedIn={signedIn}
                  onPeek={openRow}
                />
              </div>
            );
          })}
        </div>
      ) : (
        boards.map((board) => {
          const rows = cards.filter((c) => c.board === board);
          if (rows.length === 0) return null;
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
              {grouped ? (
                <div className="space-y-6">
                  {groupDeckCardsByType(rows).map((group) => (
                    <div key={group.id} className="space-y-3">
                      <h3 className="text-sm font-medium text-muted-foreground">
                        {group.label}
                        <span className="ml-1.5 font-normal tabular-nums">
                          ({group.totalQuantity})
                        </span>
                      </h3>
                      <PreconCardGrid
                        rows={group.cards}
                        signedIn={signedIn}
                        onPeek={openRow}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <PreconCardGrid
                  rows={[...rows].sort(compareByCmcThenName)}
                  signedIn={signedIn}
                  onPeek={openRow}
                />
              )}
            </section>
          );
        })
      )}
    </div>
  );
}

function PreconCardListRows({
  rows,
  signedIn,
  onPeek,
}: {
  rows: PreconCardView[];
  signedIn: boolean;
  onPeek: (row: PreconCardView) => void;
}) {
  return (
    <ul className="space-y-0.5">
      {rows.map((row) => {
        const missing = row.missingQty > 0;
        return (
          <li key={row.id} className="break-inside-avoid">
            <div className="flex min-w-0 items-center gap-1.5 py-0.5 text-sm">
              <span className="w-8 shrink-0 tabular-nums text-muted-foreground">
                {row.quantity}×
              </span>
              <CardNameWithHoverPreview
                name={row.name}
                imageUri={row.imageUri}
                faces={row.faces}
                onOpen={() => onPeek(row)}
                className="min-w-0 flex-1 basis-24"
              />
              <ManaCost cost={row.manaCost} size="xs" className="shrink-0" />
              {signedIn ? (
                <span
                  className={cn(
                    STATUS_CHIP_CLASS,
                    "hidden shrink-0 md:inline-flex",
                    missing ? LABEL_MISSING_CLASS : LABEL_OWNED_CLASS,
                  )}
                >
                  {missing
                    ? `Missing ×${row.missingQty}`
                    : `Owned ×${row.ownedQty}`}
                </span>
              ) : null}
              <PriceChip
                prices={row.prices}
                preferredFinish={row.finish}
                mode="finish"
                className="ml-auto hidden shrink-0 lg:inline-flex"
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function PreconCardGrid({
  rows,
  signedIn,
  onPeek,
}: {
  rows: PreconCardView[];
  signedIn: boolean;
  onPeek: (row: PreconCardView) => void;
}) {
  return (
    <ul className={CARD_FACE_GRID_CLASS}>
      {rows.map((row) => {
        const missing = row.missingQty > 0;
        return (
          <li key={row.id} className="min-w-0">
            <CardFaceTile
              href={row.slug ? `/cards/${row.slug}` : null}
              onOpen={() => onPeek(row)}
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
                    {signedIn ? (
                      <span
                        className={cn(
                          STATUS_CHIP_CLASS,
                          "shrink-0",
                          missing ? LABEL_MISSING_CLASS : LABEL_OWNED_CLASS,
                        )}
                      >
                        {missing
                          ? `Missing ×${row.missingQty}`
                          : `Owned ×${row.ownedQty}`}
                      </span>
                    ) : null}
                  </div>
                  <p className="truncate text-xs font-medium">
                    <span className="tabular-nums text-muted-foreground">
                      {row.quantity}×
                    </span>{" "}
                    {row.name}
                  </p>
                </div>
              }
            />
          </li>
        );
      })}
    </ul>
  );
}
