"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

type CardResult = {
  id: string;
  name: string;
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

  useEffect(() => {
    if (query.trim().length < 2) {
      setCards([]);
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
  }, [query]);

  return (
    <div className="mx-auto min-h-screen max-w-4xl px-4 py-10">
      <header className="mb-8">
        <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-800">
          ← Home
        </Link>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Card Search</h1>
        <p className="mt-1 text-zinc-600">
          Search the Scryfall catalog synced to EDHForge.
        </p>
      </header>

      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search cards (min. 2 characters)..."
        className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-base shadow-sm outline-none ring-0 focus:border-zinc-500"
        autoFocus
      />

      {loading && <p className="mt-4 text-sm text-zinc-500">Searching...</p>}
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <ul className="mt-6 space-y-3">
        {cards.map((card) => (
          <li
            key={card.id}
            className="flex items-center gap-4 rounded-lg border border-zinc-200 bg-white p-3 shadow-sm"
          >
            {card.imageUri ? (
              <Image
                src={card.imageUri}
                alt={card.name}
                width={44}
                height={62}
                className="rounded"
                unoptimized
              />
            ) : (
              <div className="flex h-[62px] w-[44px] items-center justify-center rounded bg-zinc-100 text-xs text-zinc-400">
                ?
              </div>
            )}
            <div>
              <p className="font-medium">{card.name}</p>
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

      {!loading && query.length >= 2 && cards.length === 0 && (
        <p className="mt-6 text-sm text-zinc-500">No cards found.</p>
      )}
    </div>
  );
}
