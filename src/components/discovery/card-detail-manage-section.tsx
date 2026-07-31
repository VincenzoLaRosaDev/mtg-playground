"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

import { CardManagePanels } from "@/components/discovery/card-manage-panels";
import {
  loadCardDetailDeckSnapshot,
  loadCardDetailModalUserData,
} from "@/lib/cards/actions";
import type { OracleCollectionSnapshot } from "@/lib/collection/oracle-collection";
import type { DeckPickerItem } from "@/lib/decks/decks";
import {
  pickDefaultDeckId,
  readLastDeckId,
  writeLastDeckId,
} from "@/lib/decks/last-deck";
import type { OracleDeckSnapshot } from "@/lib/decks/oracle-deck";
import type { PrintingFinish } from "@/lib/scryfall/card-printing";

type CardDetailManageSectionProps = {
  slug: string;
  cardId: string;
  oracleId: string;
  typeLine: string;
  legalities: unknown;
  printingId: string | null;
  finish: PrintingFinish;
  /** SSR collection snapshot for the active printing. */
  collectionSnapshot: OracleCollectionSnapshot | null;
};

/**
 * PDP Collection | Decks manage row — decks load client-side after sign-in.
 */
export function CardDetailManageSection({
  slug,
  cardId,
  oracleId,
  typeLine,
  legalities,
  printingId,
  finish,
  collectionSnapshot,
}: CardDetailManageSectionProps) {
  const { data: session, status } = useSession();
  const sessionUserId = session?.user?.id ?? null;
  const [decks, setDecks] = useState<DeckPickerItem[]>([]);
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
  const [deckSnapshot, setDeckSnapshot] = useState<OracleDeckSnapshot | null>(
    null,
  );
  const [liveCollection, setLiveCollection] =
    useState<OracleCollectionSnapshot | null>(collectionSnapshot);
  const [loading, setLoading] = useState(false);
  const [syncedSnapshot, setSyncedSnapshot] = useState(collectionSnapshot);
  const [syncedSessionUserId, setSyncedSessionUserId] = useState(sessionUserId);
  const [syncedFetchKey, setSyncedFetchKey] = useState<string | null>(null);

  const fetchKey =
    status === "authenticated" && sessionUserId
      ? `${oracleId}|${printingId ?? ""}|${finish}|${sessionUserId}`
      : null;
  const needsFetch = fetchKey != null;

  if (collectionSnapshot !== syncedSnapshot) {
    setSyncedSnapshot(collectionSnapshot);
    setLiveCollection(collectionSnapshot);
  }

  if (sessionUserId !== syncedSessionUserId) {
    setSyncedSessionUserId(sessionUserId);
    if (!sessionUserId) {
      setDecks([]);
      setSelectedDeckId(null);
      setDeckSnapshot(null);
      setLoading(false);
      setSyncedFetchKey(null);
    }
  }

  if (needsFetch && fetchKey !== syncedFetchKey) {
    setSyncedFetchKey(fetchKey);
    setLoading(true);
  }

  useEffect(() => {
    if (!needsFetch || !fetchKey) return;

    let cancelled = false;
    const lastId = readLastDeckId();

    void loadCardDetailModalUserData({
      oracleId,
      deckId: lastId,
      printingId,
      finish,
    }).then(async (data) => {
      if (cancelled || !data) {
        if (!cancelled) setLoading(false);
        return;
      }

      setLiveCollection(data.collection);
      setDecks(data.decks);

      const nextId = pickDefaultDeckId({
        deckIds: data.decks.map((d) => d.id),
        lastDeckId: lastId,
      });
      setSelectedDeckId(nextId);

      if (!nextId) {
        setDeckSnapshot(null);
        setLoading(false);
        return;
      }

      if (lastId === nextId) {
        setDeckSnapshot(data.deck);
        setLoading(false);
        return;
      }

      setDeckSnapshot(null);
      setLoading(false);
      const deckOnly = await loadCardDetailDeckSnapshot({
        oracleId,
        deckId: nextId,
      });
      if (cancelled) return;
      setDeckSnapshot(deckOnly);
    });

    return () => {
      cancelled = true;
    };
  }, [needsFetch, fetchKey, oracleId, printingId, finish]);

  function handleDeckChange(deckId: string) {
    writeLastDeckId(deckId);
    setSelectedDeckId(deckId);
    if (status !== "authenticated") return;
    setLoading(true);
    void loadCardDetailDeckSnapshot({
      oracleId,
      deckId,
    }).then((deck) => {
      setDeckSnapshot(deck);
      setLoading(false);
    });
  }

  async function refreshAfterMutation() {
    const data = await loadCardDetailModalUserData({
      oracleId,
      deckId: selectedDeckId,
      printingId,
      finish,
    });
    if (!data) return;
    setLiveCollection(data.collection);
    setDecks(data.decks);
    setDeckSnapshot(data.deck);
  }

  return (
    <CardManagePanels
      slug={slug}
      cardId={cardId}
      typeLine={typeLine}
      legalities={legalities}
      printingId={printingId}
      finish={finish}
      collectionSnapshot={
        status === "authenticated" ? liveCollection : collectionSnapshot
      }
      decks={decks}
      selectedDeckId={selectedDeckId}
      onSelectedDeckIdChange={handleDeckChange}
      deckSnapshot={deckSnapshot}
      collectionLoading={status === "loading"}
      deckLoading={status === "authenticated" && loading}
      onCollectionMutated={() => {
        void refreshAfterMutation();
      }}
      onDeckMutated={() => {
        void refreshAfterMutation();
      }}
    />
  );
}
