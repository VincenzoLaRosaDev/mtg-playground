"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { CardDetailModal } from "@/components/discovery/card-detail-modal";
import { loadCardDetailModal } from "@/lib/cards/actions";
import type {
  CardDetailModalMode,
  CardDetailModalPayload,
} from "@/lib/cards/card-detail-modal";
import { flipFaceUris, type CardFaceImage } from "@/lib/scryfall/faces";
import { preloadImage } from "@/lib/ui/preload-image";

/** Page-scoped deck workspace — when set, detail modal uses deck CTAs. */
export type DeckCardDetailWorkspace = {
  deckId: string;
  /** Scryfall format key — caps Add qty in the modal. */
  format: string;
  onDeckMutated?: () => void;
};

/**
 * Page-scoped collection workspace — when set, successful collection adds
 * close the modal so the page list is the feedback.
 */
export type CollectionCardDetailWorkspace = {
  onCollectionMutated?: () => void;
};

export type OpenCardDetailOptions = {
  /** @deprecated Prefer page workspace; ignored when a deck workspace is active. */
  mode?: CardDetailModalMode;
  cardId?: string;
  slug?: string;
  oracleId?: string;
  preferredPrintingId?: string | null;
  initialSet?: string | null;
  initialCn?: string | null;
  initialFinish?: string | null;
  deckId?: string | null;
  deckCardId?: string | null;
  onDeckMutated?: () => void;
  /**
   * Known art from the tile/search hit — warm the browser cache while the
   * modal payload loads so the hero paints immediately on open.
   */
  imageUri?: string | null;
  faces?: CardFaceImage[] | null;
};
type CardDetailModalContextValue = {
  openCardDetail: (options: OpenCardDetailOptions) => void;
  closeCardDetail: () => void;
  /**
   * Register the current deck editor page. While set, any openCardDetail
   * (header search, browse tiles, deck list) uses add-to-deck CTAs.
   */
  setDeckWorkspace: (workspace: DeckCardDetailWorkspace | null) => void;
  /**
   * Register the collection page. While set, successful collection adds
   * close the modal instead of showing an “Added” toast line.
   */
  setCollectionWorkspace: (
    workspace: CollectionCardDetailWorkspace | null,
  ) => void;
};

const CardDetailModalContext =
  createContext<CardDetailModalContextValue | null>(null);

type SessionState = {
  open: boolean;
  payload: CardDetailModalPayload | null;
  mode: CardDetailModalMode;
  deckId: string | null;
  deckFormat: string | null;
  deckCardId: string | null;
  onDeckMutated?: () => void;
  /** Close modal after a successful add (collection or deck workspace pages). */
  closeAfterAdd: boolean;
  onCollectionMutated?: () => void;
};

const INITIAL: SessionState = {
  open: false,
  payload: null,
  mode: "collection",
  deckId: null,
  deckFormat: null,
  deckCardId: null,
  closeAfterAdd: false,
};

export function CardDetailModalProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SessionState>(INITIAL);
  const [deckWorkspace, setDeckWorkspace] =
    useState<DeckCardDetailWorkspace | null>(null);
  const [collectionWorkspace, setCollectionWorkspace] =
    useState<CollectionCardDetailWorkspace | null>(null);
  const requestIdRef = useRef(0);

  const closeCardDetail = useCallback(() => {
    requestIdRef.current += 1;
    setState((prev) => ({ ...prev, open: false, payload: null }));
  }, []);

  const openCardDetail = useCallback(
    (options: OpenCardDetailOptions) => {
      // Page context wins: on a deck editor route, always deck mode.
      const mode: CardDetailModalMode = deckWorkspace ? "deck" : "collection";
      const deckId = options.deckId ?? deckWorkspace?.deckId ?? null;
      const closeAfterAdd = Boolean(deckWorkspace || collectionWorkspace);
      const requestId = ++requestIdRef.current;

      // Warm Scryfall art while the server payload loads (sheet still closed).
      const previewUris = flipFaceUris(options.faces, options.imageUri);
      preloadImage(previewUris[0]);

      // Do not open the sheet until payload is ready (no skeleton flash).
      setState({
        open: false,
        payload: null,
        mode,
        deckId,
        deckFormat: deckWorkspace?.format ?? null,
        deckCardId: options.deckCardId ?? null,
        onDeckMutated: options.onDeckMutated ?? deckWorkspace?.onDeckMutated,
        closeAfterAdd,
        onCollectionMutated: collectionWorkspace?.onCollectionMutated,
      });

      void loadCardDetailModal({
        cardId: options.cardId,
        slug: options.slug,
        oracleId: options.oracleId,
        preferredPrintingId: options.preferredPrintingId,
        initialSet: options.initialSet,
        initialCn: options.initialCn,
        initialFinish: options.initialFinish,
      }).then((payload) => {
        if (requestId !== requestIdRef.current) return;
        if (!payload) return;
        setState((prev) => ({
          ...prev,
          open: true,
          payload,
        }));
      });
    },
    [deckWorkspace, collectionWorkspace],
  );

  const value = useMemo(
    () => ({
      openCardDetail,
      closeCardDetail,
      setDeckWorkspace,
      setCollectionWorkspace,
    }),
    [openCardDetail, closeCardDetail],
  );

  return (
    <CardDetailModalContext.Provider value={value}>
      {children}
      <CardDetailModal
        open={state.open}
        onOpenChange={(open) => {
          if (!open) closeCardDetail();
        }}
        payload={state.payload}
        mode={state.mode}
        deckId={state.deckId}
        deckFormat={state.deckFormat}
        deckCardId={state.deckCardId}
        onDeckMutated={state.onDeckMutated}
        closeAfterAdd={state.closeAfterAdd}
        onCollectionMutated={state.onCollectionMutated}
      />
    </CardDetailModalContext.Provider>
  );
}

export function useCardDetailModal(): CardDetailModalContextValue {
  const ctx = useContext(CardDetailModalContext);
  if (!ctx) {
    throw new Error(
      "useCardDetailModal must be used within CardDetailModalProvider",
    );
  }
  return ctx;
}
