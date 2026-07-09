"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { PageShell } from "@/components/layout/page-shell";
import { formatReleaseDate, formatSetType } from "@/lib/scryfall/sets";

type SetResult = {
  code: string;
  name: string;
  releasedAt: string | null;
  setType: string;
  cardCount: number;
  iconUri: string | null;
  digital: boolean;
  indexedCardCount: number;
};

export default function SetsPage() {
  const [query, setQuery] = useState("");
  const [sets, setSets] = useState<SetResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasSearchQuery = query.trim().length >= 2;

  const fetchSets = useCallback(async (searchQuery: string, signal?: AbortSignal) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ limit: "60" });
      if (searchQuery.trim().length >= 2) {
        params.set("q", searchQuery.trim());
      }

      const response = await fetch(`/api/sets/search?${params.toString()}`, { signal });

      if (!response.ok) {
        throw new Error("Failed to load sets");
      }

      const data = (await response.json()) as { sets: SetResult[] };
      setSets(data.sets);
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      void fetchSets(hasSearchQuery ? query : "", controller.signal);
    }, hasSearchQuery ? 250 : 0);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [fetchSets, hasSearchQuery, query]);

  return (
    <PageShell
      title="Sets"
      description="Browse Magic sets and explore cards by release."
    >
      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search sets by name or code (min. 2 characters)..."
        className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-base shadow-sm outline-none ring-0 focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950"
        autoFocus
      />

      <p className="mt-3 text-sm text-zinc-500">
        {hasSearchQuery ? "Search results" : "Recent sets by release date"}
      </p>

      {loading && <p className="mt-4 text-sm text-zinc-500">Loading...</p>}
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <ul className="mt-6 space-y-3">
        {sets.map((set) => (
          <li
            key={set.code}
            className="flex items-center gap-4 rounded-lg border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
          >
            {set.iconUri ? (
              <div className="relative h-8 w-8 shrink-0">
                <Image
                  src={set.iconUri}
                  alt=""
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
            ) : (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-zinc-100 text-xs text-zinc-400 dark:bg-zinc-900">
                ?
              </div>
            )}
            <div className="min-w-0 flex-1">
              <Link href={`/sets/${set.code}`} className="font-medium hover:underline">
                {set.name}
              </Link>
              <p className="text-sm text-zinc-600">
                {set.code.toUpperCase()} · {formatSetType(set.setType)}
                {set.digital ? " · Digital" : ""}
              </p>
              <p className="text-xs text-zinc-500">
                {formatReleaseDate(set.releasedAt ? new Date(set.releasedAt) : null)}
                {" · "}
                {set.indexedCardCount > 0
                  ? `${set.indexedCardCount.toLocaleString()} cards indexed`
                  : `${set.cardCount.toLocaleString()} cards (not indexed yet)`}
              </p>
            </div>
          </li>
        ))}
      </ul>

      {!loading && sets.length === 0 && (
        <p className="mt-6 text-sm text-zinc-500">
          {hasSearchQuery ? "No sets found." : "No set data available yet. Run sync:scryfall-sets."}
        </p>
      )}
    </PageShell>
  );
}
