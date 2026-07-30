"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { deleteDeck } from "@/lib/decks/actions";
import type { DeckListItem } from "@/lib/decks/decks";
import { cn } from "@/lib/utils";

function formatRelative(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

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
      <ul className="divide-y divide-border/60 rounded-lg border border-border/60">
        {decks.map((deck) => (
          <li
            key={deck.id}
            className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
          >
            <div className="min-w-0 space-y-0.5">
              <Link
                href={`/decks/${deck.id}`}
                className="font-medium text-foreground hover:underline"
              >
                {deck.name}
              </Link>
              <p className="text-xs text-muted-foreground">
                {deck.formatLabel} · {deck.sizeLabel} · Updated{" "}
                {formatRelative(deck.updatedAt)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                nativeButton={false}
                render={<Link href={`/decks/${deck.id}`} />}
              >
                Edit
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={cn("text-destructive hover:text-destructive")}
                disabled={pending && pendingId === deck.id}
                onClick={() =>
                  setConfirmTarget({ id: deck.id, name: deck.name })
                }
              >
                Delete
              </Button>
            </div>
          </li>
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
