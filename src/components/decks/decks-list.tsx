"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { DeckListCard } from "@/components/decks/deck-list-card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { deleteDeck } from "@/lib/decks/actions";
import type { DeckListItem } from "@/lib/decks/decks";
import { CARD_FACE_GRID_CLASS } from "@/lib/ui/card-face";

type DecksListProps = {
  decks: DeckListItem[];
};

export function DecksList({ decks }: DecksListProps) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [confirmTarget, setConfirmTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);

  function runDelete(deckId: string) {
    setError(null);
    setPendingId(deckId);
    startTransition(async () => {
      const result = await deleteDeck(deckId);
      setPendingId(null);
      setConfirmTarget(null);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  if (decks.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No decks yet. Create one to start building.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <ul className={CARD_FACE_GRID_CLASS}>
        {decks.map((deck) => (
          <DeckListCard
            key={deck.id}
            deck={deck}
            deletePending={pending && pendingId === deck.id}
            onDelete={() =>
              setConfirmTarget({ id: deck.id, name: deck.name })
            }
          />
        ))}
      </ul>

      <ConfirmDialog
        open={confirmTarget != null}
        onOpenChange={(open) => {
          if (!open && !pending) setConfirmTarget(null);
        }}
        title="Delete deck?"
        description={
          confirmTarget
            ? `Delete “${confirmTarget.name}”? This cannot be undone.`
            : ""
        }
        confirmLabel="Delete"
        variant="destructive"
        pending={pending}
        onConfirm={() => {
          if (confirmTarget) runDelete(confirmTarget.id);
        }}
      />
    </div>
  );
}
