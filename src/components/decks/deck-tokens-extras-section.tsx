"use client";

import { useCardDetailModal } from "@/components/discovery/card-detail-modal-provider";
import { CardFaceTile } from "@/components/discovery/card-face-tile";
import { CardNameWithHoverPreview } from "@/components/discovery/card-hover-preview";
import {
  DECK_LIST_COLUMNS_CLASS,
  DeckListBoardHeading,
} from "@/components/decks/deck-card-list";
import {
  DeckViewToggle,
  useDeckEditorView,
  usePreconDeckView,
  type DeckEditorViewMode,
} from "@/components/decks/deck-view-toggle";
import type { DeckTokenFace, DeckTokensExtras } from "@/lib/decks/tokens-extras";
import { CARD_FACE_GRID_CLASS } from "@/lib/ui/card-face";
import { cn } from "@/lib/utils";

type DeckTokensExtrasSectionProps = {
  tokensExtras: DeckTokensExtras;
  /** Share List/Grid preference with deck editor or precon detail. */
  viewPreference?: "deck" | "precon";
  className?: string;
};

export function DeckTokensExtrasSection({
  tokensExtras,
  viewPreference = "deck",
  className,
}: DeckTokensExtrasSectionProps) {
  const { openCardDetail } = useCardDetailModal();
  const [deckView, setDeckView] = useDeckEditorView();
  const [preconView, setPreconView] = usePreconDeckView();
  const view: DeckEditorViewMode =
    viewPreference === "precon" ? preconView : deckView;
  const setView =
    viewPreference === "precon" ? setPreconView : setDeckView;

  const tokens = tokensExtras.tokens;
  const extras = tokensExtras.extras;
  const totalCount = tokens.length + extras.length;

  if (totalCount === 0) {
    return null;
  }

  function openItem(item: DeckTokenFace) {
    if (!item.slug) return;
    openCardDetail({
      slug: item.slug,
      oracleId: item.oracleId,
      imageUri: item.imageUri,
      faces: item.faces,
    });
  }

  return (
    <section
      className={cn("space-y-4", className)}
      aria-labelledby="deck-tokens-extras-heading"
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2
          id="deck-tokens-extras-heading"
          className="font-heading text-lg font-semibold"
        >
          Deck Tokens &amp; Extras{" "}
          <span className="font-normal text-muted-foreground tabular-nums">
            ({totalCount})
          </span>
        </h2>
        <DeckViewToggle value={view} onChange={setView} />
      </div>

      {tokens.length > 0 ? (
        <TokenExtraGroup
          label="Tokens"
          items={tokens}
          view={view}
          onOpen={openItem}
        />
      ) : null}

      {extras.length > 0 ? (
        <TokenExtraGroup
          label="Extras"
          items={extras}
          view={view}
          onOpen={openItem}
        />
      ) : null}
    </section>
  );
}

function TokenExtraGroup({
  label,
  items,
  view,
  onOpen,
}: {
  label: string;
  items: DeckTokenFace[];
  view: DeckEditorViewMode;
  onOpen: (item: DeckTokenFace) => void;
}) {
  return (
    <div>
      {view === "list" ? (
        <div className={DECK_LIST_COLUMNS_CLASS}>
          <div className="mb-2">
            <DeckListBoardHeading label={label} totalQuantity={items.length} />
            <ul className="space-y-0.5">
              {items.map((item) => (
                <li key={item.oracleId} className="break-inside-avoid">
                  <TokenExtraListRow item={item} onOpen={() => onOpen(item)} />
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <section className="space-y-3">
          <h3 className="font-heading text-lg font-semibold">
            {label}
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              ({items.length})
            </span>
          </h3>
          <ul className={CARD_FACE_GRID_CLASS}>
            {items.map((item) => (
              <li key={item.oracleId}>
                <CardFaceTile
                  onOpen={item.slug ? () => onOpen(item) : undefined}
                  imageUri={item.imageUri}
                  faces={item.faces}
                  name={item.name}
                  footer={
                    <p className="truncate text-sm font-medium">{item.name}</p>
                  }
                />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function TokenExtraListRow({
  item,
  onOpen,
}: {
  item: DeckTokenFace;
  onOpen: () => void;
}) {
  return (
    <div className="flex min-w-0 items-center gap-1.5 py-0.5 text-sm">
      <CardNameWithHoverPreview
        name={item.name}
        imageUri={item.imageUri}
        faces={item.faces}
        onOpen={onOpen}
        className="min-w-0 flex-1"
      />
      {item.typeLine ? (
        <span className="hidden max-w-[40%] truncate text-xs text-muted-foreground sm:inline">
          {item.typeLine}
        </span>
      ) : null}
    </div>
  );
}
