"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { CardImage } from "@/components/discovery/card-image";
import { PageShell } from "@/components/layout/page-shell";

type CommanderResult = {
  slug: string;
  name: string;
  rank: number | null;
  salt: number | null;
  numDecks: number | null;
  colorIdentity: string[];
  card: {
    imageUri: string | null;
    typeLine: string | null;
  } | null;
};

function formatColorIdentity(colors: string[]): string {
  return colors.length > 0 ? colors.join("") : "Colorless";
}

function formatRank(rank: number | null): string {
  return rank != null ? `#${rank}` : "—";
}

export default function CommandersPage() {
  const [query, setQuery] = useState("");
  const [commanders, setCommanders] = useState<CommanderResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasSearchQuery = query.trim().length >= 2;

  const fetchCommanders = useCallback(async (searchQuery: string, signal?: AbortSignal) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ limit: "50" });
      if (searchQuery.trim().length >= 2) {
        params.set("q", searchQuery.trim());
      }

      const response = await fetch(`/api/commanders/search?${params.toString()}`, {
        signal,
      });

      if (!response.ok) {
        throw new Error("Failed to load commanders");
      }

      const data = (await response.json()) as { commanders: CommanderResult[] };
      setCommanders(data.commanders);
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
      void fetchCommanders(hasSearchQuery ? query : "", controller.signal);
    }, hasSearchQuery ? 250 : 0);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [fetchCommanders, hasSearchQuery, query]);

  return (
    <PageShell
      title="Commanders"
      description="Browse EDHREC commander popularity, salt scores, and ranks."
    >
      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search commanders (min. 2 characters)..."
        className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-base shadow-sm outline-none ring-0 focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950"
        autoFocus
      />

      <p className="mt-3 text-sm text-zinc-500">
        {hasSearchQuery ? "Search results" : "Top commanders by EDHREC rank"}
      </p>

      {loading && <p className="mt-4 text-sm text-zinc-500">Loading...</p>}
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <ul className="mt-6 space-y-3">
        {commanders.map((commander) => (
          <li
            key={commander.slug}
            className="flex items-center gap-4 rounded-lg border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
          >
            {commander.card?.imageUri ? (
              <CardImage
                src={commander.card.imageUri}
                alt={commander.name}
                variant="thumbnail"
              />
            ) : (
              <div className="flex h-[62px] w-[44px] shrink-0 items-center justify-center rounded border border-zinc-200 bg-zinc-100 text-xs text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900">
                ?
              </div>
            )}
            <div className="min-w-0 flex-1">
              <Link
                href={`/commanders/${commander.slug}`}
                className="font-medium hover:underline"
              >
                {commander.name}
              </Link>
              {commander.card?.typeLine && (
                <p className="text-sm text-zinc-600">{commander.card.typeLine}</p>
              )}
              <p className="text-xs text-zinc-500">
                Rank {formatRank(commander.rank)}
                {commander.salt != null ? ` · Salt ${commander.salt.toFixed(2)}` : ""}
                {commander.numDecks != null
                  ? ` · ${commander.numDecks.toLocaleString()} decks`
                  : ""}
                {commander.colorIdentity.length > 0
                  ? ` · ${formatColorIdentity(commander.colorIdentity)}`
                  : ""}
              </p>
            </div>
          </li>
        ))}
      </ul>

      {!loading && commanders.length === 0 && (
        <p className="mt-6 text-sm text-zinc-500">
          {hasSearchQuery ? "No commanders found." : "No commander data available yet."}
        </p>
      )}
    </PageShell>
  );
}
