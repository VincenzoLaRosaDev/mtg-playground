"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { XIcon } from "lucide-react";
import { useEffect, useState, useTransition } from "react";

import { useSignInSheet } from "@/components/auth/sign-in-sheet";
import { CardMultifaceImage } from "@/components/discovery/card-multiface-image";
import { ClassificationBadges } from "@/components/discovery/classification-badges";
import { DetailHeroMeta } from "@/components/discovery/detail-hero-meta";
import { EntityPreviewFooter } from "@/components/discovery/entity-preview-footer";
import {
  VersionPicker,
  type PrintingSelection,
} from "@/components/discovery/version-picker";
import { VersionsBrowser } from "@/components/discovery/versions-browser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  loadCardDetailModalUserData,
  loadOraclePrintings,
} from "@/lib/cards/actions";
import {
  snapshotForPrinting,
  type CardDetailModalMode,
  type CardDetailModalPayload,
} from "@/lib/cards/card-detail-modal";
import { addOwnedCopies, addWishCopies } from "@/lib/collection/actions";
import type { OracleCollectionSnapshot } from "@/lib/collection/oracle-collection";
import { upsertDeckCard, setPreferredPrinting } from "@/lib/decks/actions";
import type { DeckBoard } from "@/lib/decks/boards";
import { maxCopiesForCard } from "@/lib/decks/legality";
import type { OracleDeckSnapshot } from "@/lib/decks/oracle-deck";
import {
  buildCardVersionHref,
  parsePrintingFinish,
  resolveActiveFinish,
  type OraclePrintingOption,
  type PrintingFinish,
} from "@/lib/scryfall/card-printing";
import {
  CARD_DETAIL_MODAL_HERO_GRID_CLASS,
  CARD_DETAIL_MODAL_IMAGE_COLUMN_CLASS,
  SHEET_LIST_RULE_CLASS,
  siteContainerClassName,
} from "@/lib/ui/layout";
import { QTY_INPUT_WIDTH_CLASS } from "@/lib/ui/qty-input";
import {
  LABEL_INFO_CLASS,
  LABEL_PRIMARY_CLASS,
  STATUS_CHIP_CLASS,
} from "@/lib/ui/selection-chrome";
import { clearBodyScrollRestore } from "@/lib/ui/scroll";
import { cn } from "@/lib/utils";

const FINISH_LABELS: Record<PrintingFinish, string> = {
  nonfoil: "Nonfoil",
  foil: "Foil",
  etched: "Etched",
};

function printingFinishes(printing: OraclePrintingOption): PrintingFinish[] {
  return printing.finishes
    .map((value) => parsePrintingFinish(value))
    .filter((value): value is PrintingFinish => value != null);
}

export type CardDetailModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payload: CardDetailModalPayload | null;
  mode: CardDetailModalMode;
  /** Required when mode === "deck". */
  deckId?: string | null;
  /** Deck format key — caps Add qty. */
  deckFormat?: string | null;
  /** Existing deck card id when inspecting a row already in the deck. */
  deckCardId?: string | null;
  onDeckMutated?: () => void;
  /** Collection / deck workspace pages: close modal after a successful add. */
  closeAfterAdd?: boolean;
  onCollectionMutated?: () => void;
};

/**
 * Unified in-app card detail overlay: hero + version grid + mode CTAs + View detail.
 */
export function CardDetailModal({
  open,
  onOpenChange,
  payload,
  mode,
  deckId = null,
  deckFormat = null,
  deckCardId = null,
  onDeckMutated,
  closeAfterAdd = false,
  onCollectionMutated,
}: CardDetailModalProps) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { openSignIn } = useSignInSheet();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [qty, setQty] = useState("1");
  const [activePrintingId, setActivePrintingId] = useState<string | null>(
    payload?.activePrintingId ?? null,
  );
  const [selectedFinish, setSelectedFinish] = useState<PrintingFinish>(
    payload?.selectedFinish ?? "nonfoil",
  );
  const [collectionBase, setCollectionBase] =
    useState<OracleCollectionSnapshot | null>(payload?.collection ?? null);
  const [deckSnapshot, setDeckSnapshot] = useState<OracleDeckSnapshot | null>(
    payload?.deck ?? null,
  );
  const [activeDeckCardId, setActiveDeckCardId] = useState<string | null>(
    deckCardId,
  );
  const [syncedPayload, setSyncedPayload] = useState(payload);
  const [syncedDeckCardId, setSyncedDeckCardId] = useState(deckCardId);
  const [printings, setPrintings] = useState<OraclePrintingOption[]>(
    payload?.printings ?? [],
  );
  const [printingsLoaded, setPrintingsLoaded] = useState(
    payload?.printingsLoaded ?? false,
  );
  const [versionsOpen, setVersionsOpen] = useState(false);
  const [userDataLoading, setUserDataLoading] = useState(false);

  // Reset local selection when a new payload arrives (React “adjust during render”).
  if (payload !== syncedPayload) {
    setSyncedPayload(payload);
    setActivePrintingId(payload?.activePrintingId ?? null);
    setSelectedFinish(payload?.selectedFinish ?? "nonfoil");
    setCollectionBase(null);
    setDeckSnapshot(null);
    setUserDataLoading(Boolean(payload));
    setPrintings(payload?.printings ?? []);
    setPrintingsLoaded(payload?.printingsLoaded ?? false);
    setVersionsOpen(false);
    setQty("1");
    setMessage(null);
  }
  if (deckCardId !== syncedDeckCardId) {
    setSyncedDeckCardId(deckCardId);
    setActiveDeckCardId(deckCardId);
  }

  // Collection / deck CTAs load after the catalog hero opens.
  useEffect(() => {
    if (!open || !payload) return;
    if (status === "loading") return;

    if (!session?.user) {
      setCollectionBase(null);
      setDeckSnapshot(null);
      setUserDataLoading(false);
      return;
    }

    let cancelled = false;
    setUserDataLoading(true);
    void loadCardDetailModalUserData({
      oracleId: payload.oracleId,
      deckId: mode === "deck" ? deckId : null,
      printingId: payload.activePrintingId,
      finish: payload.selectedFinish,
    }).then((data) => {
      if (cancelled) return;
      setCollectionBase(data?.collection ?? null);
      setDeckSnapshot(data?.deck ?? null);
      setUserDataLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [
    open,
    payload,
    mode,
    deckId,
    status,
    session?.user?.id,
  ]);

  const activePrinting =
    printings.find((p) => p.id === activePrintingId) ??
    printings[0] ??
    null;

  const finishes = activePrinting ? printingFinishes(activePrinting) : [];
  const finish =
    finishes.includes(selectedFinish)
      ? selectedFinish
      : resolveActiveFinish(activePrinting?.finishes ?? [], null);

  const collection = snapshotForPrinting(
    collectionBase,
    activePrinting?.id ?? null,
    finish,
  );

  const detailHref = payload
    ? buildCardVersionHref(payload.slug, {
        set: activePrinting?.setCode,
        cn: activePrinting?.collectorNumber,
        finish,
      })
    : "#";

  const callbackUrl =
    typeof window !== "undefined"
      ? `${window.location.pathname}${window.location.search}`
      : "/";

  async function ensurePrintingsLoaded(): Promise<OraclePrintingOption[]> {
    if (printingsLoaded) return printings;
    if (!payload) return printings;
    const all = await loadOraclePrintings(payload.oracleId);
    setPrintings(all);
    setPrintingsLoaded(true);
    return all;
  }

  function selectPrinting(
    printing: OraclePrintingOption,
    nextFinish?: PrintingFinish,
    nextDeckCardId?: string | null,
  ) {
    setActivePrintingId(printing.id);
    setSelectedFinish(
      nextFinish && printingFinishes(printing).includes(nextFinish)
        ? nextFinish
        : resolveActiveFinish(printing.finishes, null),
    );
    setMessage(null);
    if (nextDeckCardId !== undefined) {
      setActiveDeckCardId(nextDeckCardId);
    }

    const preferredTarget = nextDeckCardId ?? activeDeckCardId;
    if (mode === "deck" && preferredTarget) {
      startTransition(async () => {
        const result = await setPreferredPrinting({
          deckCardId: preferredTarget,
          printingId: printing.id,
        });
        if (!result.ok) {
          setMessage(result.error);
          return;
        }
        onDeckMutated?.();
      });
    }
  }

  function selectPrintingById(
    printingId: string | null | undefined,
    nextFinish?: PrintingFinish,
    nextDeckCardId?: string | null,
  ) {
    if (!printingId) {
      if (nextDeckCardId !== undefined) setActiveDeckCardId(nextDeckCardId);
      setMessage(null);
      return;
    }
    const existing = printings.find((p) => p.id === printingId);
    if (existing) {
      selectPrinting(existing, nextFinish, nextDeckCardId);
      return;
    }
    startTransition(async () => {
      const all = await ensurePrintingsLoaded();
      const printing = all.find((p) => p.id === printingId);
      if (printing) {
        selectPrinting(printing, nextFinish, nextDeckCardId);
        return;
      }
      if (nextDeckCardId !== undefined) setActiveDeckCardId(nextDeckCardId);
      setMessage(null);
    });
  }

  function handleVersionsOpenChange(openNext: boolean) {
    if (!openNext) {
      setVersionsOpen(false);
      return;
    }
    if (printingsLoaded) {
      setVersionsOpen(true);
      return;
    }
    // Defer sheet open until printings are ready (no skeleton).
    void ensurePrintingsLoaded().then(() => {
      setVersionsOpen(true);
    });
  }

  function handleSelectVersion(selection: PrintingSelection) {
    startTransition(async () => {
      const all = await ensurePrintingsLoaded();
      const printing = all.find(
        (p) =>
          p.setCode === selection.set &&
          p.collectorNumber === selection.cn,
      );
      if (printing) {
        selectPrinting(printing, selection.finish ?? undefined);
      }
    });
  }

  function parseQty(max?: number): number {
    const raw = Math.max(1, Math.floor(Number(qty)) || 1);
    if (max != null) return Math.min(raw, max);
    return raw;
  }

  function requireAuth(): boolean {
    if (session?.user) return true;
    openSignIn({ callbackUrl });
    return false;
  }

  async function refreshModalSnapshots() {
    if (!payload) return;
    const next = await loadCardDetailModalUserData({
      oracleId: payload.oracleId,
      deckId: mode === "deck" ? deckId : null,
      printingId: activePrinting?.id ?? payload.activePrintingId,
      finish,
    });
    if (!next) return;
    setCollectionBase(next.collection);
    setDeckSnapshot(next.deck);
  }

  function finishSuccessfulAdd(kind: "collection" | "deck") {
    if (kind === "collection") onCollectionMutated?.();
    else onDeckMutated?.();
    router.refresh();
    if (closeAfterAdd) {
      onOpenChange(false);
      return;
    }
  }

  function handleAddOwned() {
    if (!activePrinting || !requireAuth()) return;
    const delta = parseQty();
    setMessage(null);
    startTransition(async () => {
      const result = await addOwnedCopies({
        printingId: activePrinting.id,
        finish,
        delta,
      });
      if (!result.ok) {
        setMessage(result.error);
        return;
      }
      if (closeAfterAdd) {
        finishSuccessfulAdd("collection");
        return;
      }
      setMessage(`Added ×${delta} owned.`);
      await refreshModalSnapshots();
      router.refresh();
    });
  }

  function handleAddWish() {
    if (!activePrinting || !requireAuth()) return;
    const delta = parseQty();
    setMessage(null);
    startTransition(async () => {
      const result = await addWishCopies({
        printingId: activePrinting.id,
        finish,
        delta,
      });
      if (!result.ok) {
        setMessage(result.error);
        return;
      }
      if (closeAfterAdd) {
        finishSuccessfulAdd("collection");
        return;
      }
      setMessage(`Added ×${delta} to wish.`);
      await refreshModalSnapshots();
      router.refresh();
    });
  }

  function handleAddToBoard(board: DeckBoard) {
    if (!payload || !deckId || !requireAuth()) return;
    const delta = parseQty(
      deckFormat
        ? maxCopiesForCard({
            format: deckFormat,
            typeLine: payload.typeLine,
            legalities: payload.legalities,
          })
        : undefined,
    );
    setMessage(null);
    startTransition(async () => {
      const result = await upsertDeckCard({
        deckId,
        cardId: payload.cardId,
        board,
        delta,
        preferredPrintingId: activePrinting?.id ?? null,
      });
      if (!result.ok) {
        setMessage(result.error);
        return;
      }
      if (closeAfterAdd) {
        finishSuccessfulAdd("deck");
        return;
      }
      setMessage(board === "side" ? "Added to sideboard." : "Added to main.");
      await refreshModalSnapshots();
      onDeckMutated?.();
      router.refresh();
    });
  }

  const activeOwned = collection?.activeOwnedQty ?? 0;
  const activeWish = collection?.activeWishQty ?? 0;
  const ownedTotal = collection?.ownedTotal ?? 0;
  const wishTotal = collection?.wishTotal ?? 0;
  const collectionRows = collection?.rows ?? [];
  const deckRows = deckSnapshot?.rows ?? [];
  const deckTotal = deckSnapshot?.totalQuantity ?? 0;
  const deckQtyMax =
    mode === "deck" && deckFormat && payload
      ? maxCopiesForCard({
          format: deckFormat,
          typeLine: payload.typeLine,
          legalities: payload.legalities,
        })
      : undefined;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        size="xl"
        showCloseButton={false}
        className="max-h-[85dvh] gap-0 overflow-hidden p-0"
      >
        <SheetClose
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              className="absolute top-3 right-3 z-10 sm:hidden"
            />
          }
        >
          <XIcon />
          <span className="sr-only">Close</span>
        </SheetClose>

        {payload ? (
          <>
            <SheetHeader
              className={cn(
                siteContainerClassName,
                "shrink-0 py-4",
                SHEET_LIST_RULE_CLASS,
              )}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <div className="min-w-0 space-y-0.5 pr-10 sm:pr-0">
                  <SheetTitle>{payload.name}</SheetTitle>
                  <SheetDescription>{payload.typeLine}</SheetDescription>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  {activePrinting?.setCode ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="shrink-0"
                      nativeButton={false}
                      render={
                        <Link href={`/sets/${activePrinting.setCode}`} />
                      }
                      onClick={() => {
                        clearBodyScrollRestore();
                        onOpenChange(false);
                      }}
                    >
                      Go to set
                    </Button>
                  ) : null}
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                    nativeButton={false}
                    render={<Link href={detailHref} />}
                    onClick={() => {
                      // Unlock must not restore pre-modal scroll after this navigation.
                      clearBodyScrollRestore();
                      onOpenChange(false);
                    }}
                  >
                    View detail
                  </Button>
                  <SheetClose
                    render={
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="hidden shrink-0 sm:inline-flex"
                      />
                    }
                  >
                    <XIcon />
                    <span className="sr-only">Close</span>
                  </SheetClose>
                </div>
              </div>
            </SheetHeader>

            <div className="min-h-0 flex-1 overflow-y-auto">
              <div
                className={cn(siteContainerClassName, "space-y-6 py-4 pb-8")}
              >
                <div className={CARD_DETAIL_MODAL_HERO_GRID_CLASS}>
                  <div className={CARD_DETAIL_MODAL_IMAGE_COLUMN_CLASS}>
                    <CardMultifaceImage
                      imageUri={activePrinting?.imageUri ?? payload.imageUri}
                      faces={
                        activePrinting?.faces?.length
                          ? activePrinting.faces
                          : payload.faces
                      }
                      name={payload.name}
                      variant="detail"
                      finish={finish}
                      priority
                    />
                    <div className="mt-2 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-xs sm:justify-start">
                      {activePrinting ? (
                        <p className="text-muted-foreground">
                          {activePrinting.setCode.toUpperCase()} #
                          {activePrinting.collectorNumber}
                          {finish !== "nonfoil"
                            ? ` · ${FINISH_LABELS[finish]}`
                            : ""}
                        </p>
                      ) : null}
                      <EntityPreviewFooter
                        prices={activePrinting?.prices ?? payload.prices}
                        preferredFinish={finish}
                        showInclusionRank={false}
                        className="w-auto gap-x-2 gap-y-1 text-xs"
                      />
                    </div>
                  </div>

                  <div className="min-w-0 space-y-4">
                    <ClassificationBadges
                      classification={payload.classification}
                      status={
                        <div className="min-w-0">
                          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            Status
                          </p>
                          <DetailHeroMeta
                            popularityRank={payload.popularityRank}
                            isGameChanger={payload.isGameChanger}
                            isReserved={payload.isReserved}
                            isCommander={payload.isCommander}
                          />
                        </div>
                      }
                    />

                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Printing
                      </p>
                      <div className="mt-2">
                        <VersionPicker
                          slug={payload.slug}
                          printings={printings}
                          selectedSet={activePrinting?.setCode ?? null}
                          selectedCn={activePrinting?.collectorNumber ?? null}
                          selectedFinish={finish}
                          onSelectPrinting={handleSelectVersion}
                          onNeedPrintings={() => {
                            if (!printingsLoaded) {
                              void ensurePrintingsLoaded();
                            }
                          }}
                          versionActions={
                            <VersionsBrowser
                              slug={payload.slug}
                              printings={printingsLoaded ? printings : []}
                              printingCount={payload.printingCount}
                              selectedSet={activePrinting?.setCode ?? null}
                              selectedCn={
                                activePrinting?.collectorNumber ?? null
                              }
                              selectedFinish={finish}
                              open={versionsOpen}
                              onOpenChange={handleVersionsOpenChange}
                              onSelectPrinting={handleSelectVersion}
                            />
                          }
                        />
                      </div>
                    </div>

                    <div className="space-y-3 border-t border-border/50 pt-4">
                      {status === "loading" ? (
                      <div className="h-8 w-48 animate-pulse rounded-lg bg-muted" />
                    ) : !session?.user ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => openSignIn({ callbackUrl })}
                      >
                        {mode === "deck"
                          ? "Sign in to build decks"
                          : "Sign in to collect"}
                      </Button>
                    ) : (
                      <>
                        {userDataLoading ? (
                          <div className="h-4 w-56 animate-pulse rounded bg-muted" />
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            {activeOwned > 0 || activeWish > 0 ? (
                              <>
                                This printing:{" "}
                                {activeOwned > 0 ? (
                                  <span className="font-medium text-primary">
                                    Owned ×{activeOwned}
                                  </span>
                                ) : null}
                                {activeOwned > 0 && activeWish > 0
                                  ? " · "
                                  : null}
                                {activeWish > 0 ? (
                                  <span className="font-medium text-info-foreground">
                                    Wish ×{activeWish}
                                  </span>
                                ) : null}
                              </>
                            ) : (
                              "This printing is not in your collection."
                            )}
                            {ownedTotal + wishTotal > 0 ? (
                              <span>
                                {" "}
                                · Card total: Owned ×{ownedTotal}
                                {wishTotal > 0
                                  ? ` · Wish ×${wishTotal}`
                                  : ""}
                              </span>
                            ) : null}
                          </p>
                        )}

                        {mode === "collection" ? (
                          <div className="flex flex-wrap items-center gap-2">
                            <div className={cn(QTY_INPUT_WIDTH_CLASS, "shrink-0")}>
                              <label htmlFor="modal-qty" className="sr-only">
                                Quantity
                              </label>
                              <Input
                                id="modal-qty"
                                type="number"
                                min={1}
                                className="h-8 px-1 text-center tabular-nums"
                                value={qty}
                                disabled={pending}
                                onChange={(e) => setQty(e.target.value)}
                              />
                            </div>
                            <Button
                              type="button"
                              size="default"
                              disabled={pending || !activePrinting}
                              onClick={handleAddOwned}
                            >
                              Add owned
                            </Button>
                            <Button
                              type="button"
                              size="default"
                              variant="info"
                              disabled={pending || !activePrinting}
                              onClick={handleAddWish}
                            >
                              Add to wish
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <div className={cn(QTY_INPUT_WIDTH_CLASS, "shrink-0")}>
                                <label
                                  htmlFor="modal-deck-qty"
                                  className="sr-only"
                                >
                                  Quantity
                                </label>
                                <Input
                                  id="modal-deck-qty"
                                  type="number"
                                  min={1}
                                  max={deckQtyMax}
                                  className="h-8 px-1 text-center tabular-nums"
                                  value={qty}
                                  disabled={pending}
                                  onChange={(e) => {
                                    const next = e.target.value;
                                    if (deckQtyMax != null && next !== "") {
                                      const n = Math.floor(Number(next));
                                      if (
                                        Number.isFinite(n) &&
                                        n > deckQtyMax
                                      ) {
                                        setQty(String(deckQtyMax));
                                        return;
                                      }
                                    }
                                    setQty(next);
                                  }}
                                />
                              </div>
                              <Button
                                type="button"
                                size="default"
                                disabled={pending || !deckId}
                                onClick={() => handleAddToBoard("main")}
                              >
                                Add to main
                              </Button>
                              <Button
                                type="button"
                                size="default"
                                variant="secondary"
                                disabled={pending || !deckId}
                                onClick={() => handleAddToBoard("side")}
                              >
                                Add to sideboard
                              </Button>
                            </div>
                            {activeDeckCardId ? (
                              <p className="text-xs text-muted-foreground">
                                Selecting a version sets the preferred
                                printing for this deck card.
                              </p>
                            ) : null}
                          </div>
                        )}

                        {message ? (
                          <p
                            className="text-xs text-muted-foreground"
                            role="status"
                          >
                            {message}
                          </p>
                        ) : null}

                        {userDataLoading ? (
                          <div className="h-16 w-full max-w-sm animate-pulse rounded-lg bg-muted" />
                        ) : mode === "deck" ? (
                          deckRows.length > 0 ? (
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
                                  return (
                                    <li key={row.id}>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          selectPrintingById(
                                            row.preferredPrintingId,
                                            row.finish ?? undefined,
                                            row.id,
                                          );
                                        }}
                                        className={cn(
                                          "flex flex-wrap items-center gap-x-2 gap-y-0.5 text-left text-sm transition-colors hover:text-foreground",
                                          isActive
                                            ? "text-foreground"
                                            : "text-muted-foreground",
                                        )}
                                      >
                                        <span className="font-medium">
                                          {row.boardLabel}
                                        </span>
                                        <span className="tabular-nums">
                                          · {versionLabel}
                                        </span>
                                        {row.finish &&
                                        row.finish !== "nonfoil" ? (
                                          <span>
                                            · {FINISH_LABELS[row.finish]}
                                          </span>
                                        ) : null}
                                        <span
                                          className={cn(
                                            STATUS_CHIP_CLASS,
                                            LABEL_PRIMARY_CLASS,
                                          )}
                                        >
                                          ×{row.quantity}
                                        </span>
                                        <span
                                          className={cn(
                                            "inline-flex h-5 items-center rounded-md border px-1.5 text-[10px] font-semibold leading-none tracking-wide uppercase",
                                            row.missingQty > 0
                                              ? "border-destructive/45 bg-destructive/10 text-destructive"
                                              : "border-emerald-600/40 bg-emerald-500/15 text-emerald-800 dark:text-emerald-300",
                                          )}
                                        >
                                          {row.missingQty > 0
                                            ? `Missing ×${row.missingQty}`
                                            : `Owned ×${row.ownedQty}`}
                                        </span>
                                      </button>
                                    </li>
                                  );
                                })}
                              </ul>
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground">
                              Not in this deck yet.
                            </p>
                          )
                        ) : collectionRows.length > 0 ? (
                          <div className="space-y-1.5">
                            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                              Your copies
                            </p>
                            <ul className="space-y-1">
                              {collectionRows.map((row) => {
                                const isActive =
                                  row.printingId === activePrinting?.id &&
                                  row.finish === finish;
                                return (
                                  <li key={row.id}>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        selectPrintingById(
                                          row.printingId,
                                          row.finish,
                                        );
                                      }}
                                      className={cn(
                                        "flex flex-wrap items-center gap-x-2 gap-y-0.5 text-left text-sm transition-colors hover:text-foreground",
                                        isActive
                                          ? "text-foreground"
                                          : "text-muted-foreground",
                                      )}
                                    >
                                      <span className="font-medium tabular-nums">
                                        {row.setCode.toUpperCase()} #
                                        {row.collectorNumber}
                                      </span>
                                      <span>
                                        · {FINISH_LABELS[row.finish]}
                                      </span>
                                      <span
                                        className={cn(
                                          STATUS_CHIP_CLASS,
                                          row.wantlist
                                            ? LABEL_INFO_CLASS
                                            : LABEL_PRIMARY_CLASS,
                                        )}
                                      >
                                        {row.wantlist ? "Wish" : "Owned"} ×
                                        {row.quantity}
                                      </span>
                                    </button>
                                  </li>
                                );
                              })}
                            </ul>
                            <p className="text-xs text-muted-foreground">
                              Manage quantities on{" "}
                              <Link
                                href="/collection"
                                className="underline-offset-2 hover:underline"
                                onClick={() => {
                                  clearBodyScrollRestore();
                                  onOpenChange(false);
                                }}
                              >
                                Collection
                              </Link>
                              .
                            </p>
                          </div>
                        ) : null}
                      </>
                    )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
