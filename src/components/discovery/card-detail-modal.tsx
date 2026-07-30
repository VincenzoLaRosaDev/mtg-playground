"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { XIcon } from "lucide-react";
import { useEffect, useState, useTransition } from "react";

import { CardMultifaceImage } from "@/components/discovery/card-multiface-image";
import { CardDetailModalLists } from "@/components/discovery/card-detail-modal-lists";
import { CardManagePanels } from "@/components/discovery/card-manage-panels";
import { ClassificationBadges } from "@/components/discovery/classification-badges";
import { DetailHeroMeta } from "@/components/discovery/detail-hero-meta";
import { EntityPreviewFooter } from "@/components/discovery/entity-preview-footer";
import {
  VersionPicker,
  type PrintingSelection,
} from "@/components/discovery/version-picker";
import { VersionsBrowser } from "@/components/discovery/versions-browser";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  loadCardDetailDeckSnapshot,
  loadCardDetailModalUserData,
  loadOraclePrintings,
} from "@/lib/cards/actions";
import {
  snapshotForPrinting,
  type CardDetailModalMode,
  type CardDetailModalPayload,
} from "@/lib/cards/card-detail-modal";
import type { OracleCollectionSnapshot } from "@/lib/collection/oracle-collection";
import { setPreferredPrinting } from "@/lib/decks/actions";
import type { DeckPickerItem } from "@/lib/decks/decks";
import {
  pickDefaultDeckId,
  readLastDeckId,
  writeLastDeckId,
} from "@/lib/decks/last-deck";
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
  /** Workspace deck id when opened from a deck editor page. */
  deckId?: string | null;
  /** Deck format key — unused for caps (derived from selected deck). */
  deckFormat?: string | null;
  /** Existing deck card id when inspecting a row already in the deck. */
  deckCardId?: string | null;
  onDeckMutated?: () => void;
  /** Collection / deck workspace pages: close modal after a successful add. */
  closeAfterAdd?: boolean;
  onCollectionMutated?: () => void;
  /** Fired on successful add (before optional close) — e.g. dismiss host search. */
  onSuccessfulAdd?: () => void;
};

/**
 * Unified in-app card detail overlay: hero + version grid + manage panels + lists.
 */
export function CardDetailModal({
  open,
  onOpenChange,
  payload,
  mode,
  deckId = null,
  deckCardId = null,
  onDeckMutated,
  closeAfterAdd = false,
  onCollectionMutated,
  onSuccessfulAdd,
}: CardDetailModalProps) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [, startTransition] = useTransition();
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
  const [decks, setDecks] = useState<DeckPickerItem[]>([]);
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
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
  const sessionUserId = session?.user?.id ?? null;
  const [syncedSessionUserId, setSyncedSessionUserId] = useState(sessionUserId);
  const needsUserData = Boolean(
    open && payload && sessionUserId && status !== "loading",
  );
  const [syncedNeedsUserData, setSyncedNeedsUserData] = useState(needsUserData);
  const userDataFetchKey = needsUserData
    ? `${payload!.oracleId}|${deckId ?? ""}|${sessionUserId}`
    : null;
  const [syncedUserDataFetchKey, setSyncedUserDataFetchKey] = useState<
    string | null
  >(null);

  // Reset local selection when a new payload arrives (React “adjust during render”).
  if (payload !== syncedPayload) {
    setSyncedPayload(payload);
    setActivePrintingId(payload?.activePrintingId ?? null);
    setSelectedFinish(payload?.selectedFinish ?? "nonfoil");
    setCollectionBase(null);
    setDeckSnapshot(null);
    setDecks([]);
    setSelectedDeckId(null);
    setUserDataLoading(Boolean(payload));
    setPrintings(payload?.printings ?? []);
    setPrintingsLoaded(payload?.printingsLoaded ?? false);
    setVersionsOpen(false);
    setSyncedUserDataFetchKey(null);
  }
  if (deckCardId !== syncedDeckCardId) {
    setSyncedDeckCardId(deckCardId);
    setActiveDeckCardId(deckCardId);
  }

  // Signed-out: clear user data during render (same pattern as payload sync above).
  if (sessionUserId !== syncedSessionUserId) {
    setSyncedSessionUserId(sessionUserId);
    if (!sessionUserId) {
      setCollectionBase(null);
      setDeckSnapshot(null);
      setDecks([]);
      setSelectedDeckId(null);
      setUserDataLoading(false);
      setSyncedUserDataFetchKey(null);
    }
  }

  // Kick loading flag when a signed-in fetch becomes necessary (not inside the effect).
  if (needsUserData !== syncedNeedsUserData) {
    setSyncedNeedsUserData(needsUserData);
    if (needsUserData) {
      setUserDataLoading(true);
    }
  }

  if (
    needsUserData &&
    userDataFetchKey != null &&
    userDataFetchKey !== syncedUserDataFetchKey
  ) {
    setSyncedUserDataFetchKey(userDataFetchKey);
    setUserDataLoading(true);
  }

  // Collection + decks load after the catalog hero opens.
  useEffect(() => {
    if (!needsUserData || !payload || !sessionUserId || !userDataFetchKey) {
      return;
    }

    let cancelled = false;
    const lastId = readLastDeckId();
    const preferId = deckId ?? lastId;

    void loadCardDetailModalUserData({
      oracleId: payload.oracleId,
      deckId: preferId,
      printingId: payload.activePrintingId,
      finish: payload.selectedFinish,
    }).then(async (data) => {
      if (cancelled) return;
      // Paint collection + deck list immediately; only re-fetch deck snapshot
      // if the resolved default differs from the preferred id.
      setCollectionBase(data?.collection ?? null);
      setDecks(data?.decks ?? []);

      const nextId = pickDefaultDeckId({
        deckIds: (data?.decks ?? []).map((d) => d.id),
        workspaceDeckId: deckId,
        lastDeckId: lastId,
      });
      setSelectedDeckId(nextId);

      if (!nextId) {
        setDeckSnapshot(null);
        setUserDataLoading(false);
        return;
      }

      if (preferId === nextId) {
        setDeckSnapshot(data?.deck ?? null);
        setUserDataLoading(false);
        return;
      }

      setDeckSnapshot(null);
      setUserDataLoading(false);
      const deckOnly = await loadCardDetailDeckSnapshot({
        oracleId: payload.oracleId,
        deckId: nextId,
      });
      if (cancelled) return;
      setDeckSnapshot(deckOnly);
    });

    return () => {
      cancelled = true;
    };
  }, [needsUserData, payload, sessionUserId, userDataFetchKey, deckId]);

  const activePrinting =
    printings.find((p) => p.id === activePrintingId) ??
    printings[0] ??
    null;

  const finishes = activePrinting ? printingFinishes(activePrinting) : [];
  const finish = finishes.includes(selectedFinish)
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

  const workspaceDeckId = deckId;
  const effectiveDeckCardId =
    selectedDeckId && workspaceDeckId && selectedDeckId === workspaceDeckId
      ? activeDeckCardId
      : null;

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
    if (nextDeckCardId !== undefined) {
      setActiveDeckCardId(nextDeckCardId);
    }

    const preferredTarget = nextDeckCardId ?? effectiveDeckCardId;
    if (mode === "deck" && preferredTarget) {
      startTransition(async () => {
        const result = await setPreferredPrinting({
          deckCardId: preferredTarget,
          printingId: printing.id,
        });
        if (!result.ok) return;
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
    void ensurePrintingsLoaded().then(() => {
      setVersionsOpen(true);
    });
  }

  function handleSelectVersion(selection: PrintingSelection) {
    startTransition(async () => {
      const all = await ensurePrintingsLoaded();
      const printing = all.find(
        (p) =>
          p.setCode === selection.set && p.collectorNumber === selection.cn,
      );
      if (printing) {
        selectPrinting(printing, selection.finish ?? undefined);
      }
    });
  }

  async function refreshModalSnapshots(deckIdOverride?: string | null) {
    if (!payload) return;
    const targetDeckId =
      deckIdOverride !== undefined ? deckIdOverride : selectedDeckId;
    const next = await loadCardDetailModalUserData({
      oracleId: payload.oracleId,
      deckId: targetDeckId,
      printingId: activePrinting?.id ?? payload.activePrintingId,
      finish,
    });
    if (!next) return;
    setCollectionBase(next.collection);
    setDecks(next.decks);
    setDeckSnapshot(next.deck);
  }

  function handleSelectedDeckIdChange(nextId: string) {
    writeLastDeckId(nextId);
    setSelectedDeckId(nextId);
    if (workspaceDeckId && nextId !== workspaceDeckId) {
      setActiveDeckCardId(null);
    } else if (workspaceDeckId && nextId === workspaceDeckId) {
      setActiveDeckCardId(deckCardId);
    }
    setUserDataLoading(true);
    void loadCardDetailDeckSnapshot({
      oracleId: payload!.oracleId,
      deckId: nextId,
    })
      .then((deck) => {
        setDeckSnapshot(deck);
      })
      .finally(() => {
        setUserDataLoading(false);
      });
  }

  function handleSuccessfulAdd(kind: "collection" | "deck") {
    if (kind === "collection") onCollectionMutated?.();
    else onDeckMutated?.();
    onSuccessfulAdd?.();
    router.refresh();
    if (closeAfterAdd) {
      onOpenChange(false);
    }
  }

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
                      clearBodyScrollRestore();
                      onOpenChange(false);
                    }}
                  >
                    Go to page
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

                    <div className="border-t border-border/50 pt-4">
                      <CardManagePanels
                      slug={payload.slug}
                      cardId={payload.cardId}
                      typeLine={payload.typeLine}
                      legalities={payload.legalities}
                      printingId={activePrinting?.id ?? null}
                      finish={finish}
                      collectionSnapshot={collection}
                      decks={decks}
                      selectedDeckId={selectedDeckId}
                      onSelectedDeckIdChange={handleSelectedDeckIdChange}
                      deckSnapshot={deckSnapshot}
                      activeDeckCardId={effectiveDeckCardId}
                      collectionLoading={
                        status === "loading" ||
                        (needsUserData && userDataLoading)
                      }
                      deckLoading={
                        status === "loading" ||
                        (needsUserData && userDataLoading)
                      }
                      closeAfterAdd={closeAfterAdd}
                      inSheet
                      onSelectCopy={(row) => {
                        selectPrintingById(row.printingId, row.finish);
                      }}
                      onSelectDeckRow={(row) => {
                        selectPrintingById(
                          row.preferredPrintingId,
                          row.finish ?? undefined,
                          row.id,
                        );
                      }}
                      onCollectionMutated={() => {
                        void refreshModalSnapshots();
                      }}
                      onDeckMutated={() => {
                        void refreshModalSnapshots();
                        onDeckMutated?.();
                      }}
                      onCollectionAddSuccess={() => {
                        handleSuccessfulAdd("collection");
                      }}
                      onDeckAddSuccess={() => {
                        handleSuccessfulAdd("deck");
                      }}
                    />
                    </div>
                  </div>
                </div>

                <CardDetailModalLists
                  slug={payload.slug}
                  cardId={payload.cardId}
                  oracleId={payload.oracleId}
                  typeLine={payload.typeLine}
                  isCommander={payload.isCommander}
                  colorIdentity={payload.colorIdentity}
                  themes={payload.classification?.themes ?? []}
                  setCode={activePrinting?.setCode ?? null}
                  collectorNumber={activePrinting?.collectorNumber ?? null}
                  finish={finish}
                />
              </div>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
