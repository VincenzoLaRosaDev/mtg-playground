"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { CardImage } from "@/components/discovery/card-image";
import { PageShell } from "@/components/layout/page-shell";

type CardResult = {
  id: string;
  name: string;
  edhrecSlug: string | null;
  typeLine: string;
  cmc: number;
  colorIdentity: string[];
  imageUri: string | null;
  isCommander: boolean;
};

export default function CardsPage() {
  const [query, setQuery] = useState("");
  const [cards, setCards] = useState<CardResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasSearchQuery = query.trim().length >= 2;
  const visibleCards = hasSearchQuery ? cards : [];

  useEffect(() => {
    if (!hasSearchQuery) {
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/cards/search?q=${encodeURIComponent(query)}`,
          { signal: controller.signal },
        );

        if (!response.ok) {
          throw new Error("Search failed");
        }

        const data = (await response.json()) as { cards: CardResult[] };
        setCards(data.cards);
      } catch (err) {
        if (err instanceof Error && err.name !== "AbortError") {
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [hasSearchQuery, query]);

  return (
    <PageShell
      title="Card Search"
      description="Search the Scryfall catalog synced to EDHForge."
    >
      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search cards (min. 2 characters)..."
        className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-base shadow-sm outline-none ring-0 focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950"
        autoFocus
      />

      {loading && <p className="mt-4 text-sm text-zinc-500">Searching...</p>}
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <ul className="mt-6 space-y-3">
        {visibleCards.map((card) => (
          <li
            key={card.id}
            className="flex items-center gap-4 rounded-lg border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
          >
            {card.imageUri ? (
              <CardImage src={card.imageUri} alt={card.name} variant="thumbnail" />
            ) : (
              <div className="flex h-[62px] w-[44px] shrink-0 items-center justify-center rounded border border-zinc-200 bg-zinc-100 text-xs text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900">
                ?
              </div>
            )}
            <div>
              {card.edhrecSlug ? (
                <Link
                  href={`/cards/${card.edhrecSlug}`}
                  className="font-medium hover:underline"
                >
                  {card.name}
                </Link>
              ) : (
                <p className="font-medium">{card.name}</p>
              )}
              <p className="text-sm text-zinc-600">{card.typeLine}</p>
              <p className="text-xs text-zinc-500">
                CMC {card.cmc}
                {card.isCommander ? " · Commander" : ""}
                {card.colorIdentity.length > 0
                  ? ` · ${card.colorIdentity.join("")}`
                  : ""}
              </p>
            </div>
          </li>
        ))}
      </ul>

      {!loading && hasSearchQuery && visibleCards.length === 0 && (
        <p className="mt-6 text-sm text-zinc-500">No cards found.</p>
      )}
    </PageShell>
  );
}
