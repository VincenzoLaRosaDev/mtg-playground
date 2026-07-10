"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { CardImage } from "@/components/discovery/card-image";
import { PageShell } from "@/components/layout/page-shell";
import {
  GLOBAL_SEARCH_MIN_QUERY_LENGTH,
  type GlobalSearchResponse,
} from "@/lib/search/types";
import { formatSetType } from "@/lib/scryfall/sets";

function ResultSection({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  if (count === 0) return null;

  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold">
        {title}{" "}
        <span className="text-sm font-normal text-zinc-500">({count})</span>
      </h2>
      <ul className="mt-4 space-y-3">{children}</ul>
    </section>
  );
}

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q")?.trim() ?? "";
  const [results, setResults] = useState<GlobalSearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (query.length < GLOBAL_SEARCH_MIN_QUERY_LENGTH) {
      setResults(null);
      setError(null);
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    async function runSearch() {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({ q: query, limit: "20" });
        const response = await fetch(`/api/search?${params.toString()}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Search failed");
        }

        setResults((await response.json()) as GlobalSearchResponse);
      } catch (err) {
        if (err instanceof Error && err.name !== "AbortError") {
          setError(err.message);
          setResults(null);
        }
      } finally {
        setLoading(false);
      }
    }

    void runSearch();

    return () => controller.abort();
  }, [query]);

  const hasQuery = query.length >= GLOBAL_SEARCH_MIN_QUERY_LENGTH;
  const totalResults =
    (results?.cards.length ?? 0) +
    (results?.commanders.length ?? 0) +
    (results?.sets.length ?? 0);

  return (
    <PageShell
      title="Search"
      description="Find cards, commanders, and sets across the EDHForge catalog."
    >
      {!hasQuery && (
        <p className="text-sm text-zinc-500">
          Enter at least {GLOBAL_SEARCH_MIN_QUERY_LENGTH} characters in the header search or add{" "}
          <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-900">?q=</code> to this URL.
        </p>
      )}

      {hasQuery && (
        <p className="text-sm text-zinc-500">
          Results for <span className="font-medium text-zinc-800 dark:text-zinc-200">{query}</span>
        </p>
      )}

      {loading && <p className="mt-4 text-sm text-zinc-500">Searching...</p>}
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {!loading && hasQuery && results && totalResults === 0 && !error && (
        <p className="mt-6 text-sm text-zinc-500">No results found.</p>
      )}

      {results && (
        <>
          <ResultSection title="Commanders" count={results.commanders.length}>
            {results.commanders.map((commander) => (
              <li
                key={commander.slug}
                className="flex items-center gap-4 rounded-lg border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
              >
                {commander.imageUri ? (
                  <CardImage src={commander.imageUri} alt="" variant="thumbnail" />
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
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {commander.typeLine ?? "Commander"}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {commander.rank != null ? `Rank #${commander.rank}` : "Commander"}
                  </p>
                </div>
              </li>
            ))}
          </ResultSection>

          <ResultSection title="Cards" count={results.cards.length}>
            {results.cards.map((card) => (
              <li
                key={card.slug ?? card.name}
                className="flex items-center gap-4 rounded-lg border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
              >
                {card.imageUri ? (
                  <CardImage src={card.imageUri} alt="" variant="thumbnail" />
                ) : (
                  <div className="flex h-[62px] w-[44px] shrink-0 items-center justify-center rounded border border-zinc-200 bg-zinc-100 text-xs text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900">
                    ?
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  {card.slug ? (
                    <Link href={`/cards/${card.slug}`} className="font-medium hover:underline">
                      {card.name}
                    </Link>
                  ) : (
                    <p className="font-medium">{card.name}</p>
                  )}
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">{card.typeLine}</p>
                  <p className="text-xs text-zinc-500">
                    CMC {card.cmc}
                    {card.isCommander ? " · Commander" : ""}
                  </p>
                </div>
              </li>
            ))}
          </ResultSection>

          <ResultSection title="Sets" count={results.sets.length}>
            {results.sets.map((set) => (
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
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {set.code.toUpperCase()} · {formatSetType(set.setType)}
                  </p>
                </div>
              </li>
            ))}
          </ResultSection>
        </>
      )}
    </PageShell>
  );
}
