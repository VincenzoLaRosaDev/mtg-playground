"use client";

import { CardCollectionPanel } from "@/components/collection/card-collection-panel";
import { CardDeckAddPanel } from "@/components/decks/card-deck-add-panel";
import type { DeckPickerItem } from "@/lib/decks/decks";
import type { OracleDeckSnapshot } from "@/lib/decks/oracle-deck";
import type { OracleCollectionSnapshot } from "@/lib/collection/oracle-collection";
import type { PrintingFinish } from "@/lib/scryfall/card-printing";

type CardManagePanelsProps = {
  slug: string;
  cardId: string;
  typeLine: string;
  legalities: unknown;
  printingId: string | null;
  finish: PrintingFinish;
  collectionSnapshot: OracleCollectionSnapshot | null;
  decks: DeckPickerItem[];
  selectedDeckId: string | null;
  onSelectedDeckIdChange: (deckId: string) => void;
  deckSnapshot: OracleDeckSnapshot | null;
  activeDeckCardId?: string | null;
  collectionLoading?: boolean;
  deckLoading?: boolean;
  closeAfterAdd?: boolean;
  inSheet?: boolean;
  onSelectCopy?: (row: {
    printingId: string;
    finish: PrintingFinish;
  }) => void;
  onSelectDeckRow?: (row: {
    id: string;
    preferredPrintingId: string | null;
    finish: PrintingFinish | null;
  }) => void;
  onCollectionMutated?: () => void;
  onDeckMutated?: () => void;
  onCollectionAddSuccess?: () => void;
  onDeckAddSuccess?: () => void;
};

/**
 * Side-by-side Collection | Decks manage chrome (modal + PDP).
 */
export function CardManagePanels({
  slug,
  cardId,
  typeLine,
  legalities,
  printingId,
  finish,
  collectionSnapshot,
  decks,
  selectedDeckId,
  onSelectedDeckIdChange,
  deckSnapshot,
  activeDeckCardId = null,
  collectionLoading = false,
  deckLoading = false,
  closeAfterAdd = false,
  inSheet = false,
  onSelectCopy,
  onSelectDeckRow,
  onCollectionMutated,
  onDeckMutated,
  onCollectionAddSuccess,
  onDeckAddSuccess,
}: CardManagePanelsProps) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
      <div className="min-w-0 space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Collection
        </p>
        <CardCollectionPanel
          slug={slug}
          printingId={printingId}
          finish={finish}
          snapshot={collectionSnapshot}
          qtyInputId="manage-collection-qty"
          loading={collectionLoading}
          onSelectCopy={onSelectCopy}
          onMutated={onCollectionMutated}
          closeAfterAdd={closeAfterAdd}
          onAddSuccess={onCollectionAddSuccess}
          inSheet={inSheet}
        />
      </div>
      <div className="min-w-0 space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Decks
        </p>
        <CardDeckAddPanel
          cardId={cardId}
          typeLine={typeLine}
          legalities={legalities}
          printingId={printingId}
          decks={decks}
          selectedDeckId={selectedDeckId}
          onSelectedDeckIdChange={onSelectedDeckIdChange}
          snapshot={deckSnapshot}
          activeDeckCardId={activeDeckCardId}
          onSelectDeckRow={onSelectDeckRow}
          onMutated={onDeckMutated}
          closeAfterAdd={closeAfterAdd}
          loading={deckLoading}
          qtyInputId="manage-deck-qty"
          onAddSuccess={onDeckAddSuccess}
        />
      </div>
    </div>
  );
}
