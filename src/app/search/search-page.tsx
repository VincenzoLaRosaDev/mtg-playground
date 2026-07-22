"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { CardGridTile } from "@/components/discovery/card-grid-tile";
import { CardGridSkeleton } from "@/components/discovery/loading-skeletons";
import { SetBrowseRow } from "@/components/discovery/set-browse-row";
import { PageListMeta } from "@/components/layout/page-list-meta";
import { PageShell } from "@/components/layout/page-shell";
import { parseCatalogListPrice } from "@/lib/scryfall/card-prices";
import {
  GLOBAL_SEARCH_MIN_QUERY_LENGTH,
  GLOBAL_SEARCH_PAGE_LIMIT,
  type GlobalSearchResponse,
} from "@/lib/search/types";
import { CARD_FACE_GRID_CLASS, SET_BROWSE_GRID_CLASS } from "@/lib/ui/card-face";
import { cn } from "@/lib/utils";

function ResultSection({
  title,
  count,
  listClassName,
  children,
}: {
  title: string;
  count: number;
  listClassName: string;
  children: React.ReactNode;
}) {
  if (count === 0) return null;

  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold">
        {title}{" "}
        <span className="text-sm font-normal text-muted-foreground">({count})</span>
      </h2>
      <ul className={`mt-4 ${listClassName}`}>{children}</ul>
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
        const params = new URLSearchParams({
          q: query,
          limit: String(GLOBAL_SEARCH_PAGE_LIMIT),
        });
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
  const totalResults = (results?.cards.length ?? 0) + (results?.sets.length ?? 0);

  return (
    <PageShell
      title="Search"
      description="Find cards by name, type, or rules text — and sets by name or code."
    >
      {hasQuery ? (
        <PageListMeta>
          Results for <span className="font-medium text-foreground">{query}</span>
        </PageListMeta>
      ) : (
        <PageListMeta>
          Enter at least {GLOBAL_SEARCH_MIN_QUERY_LENGTH} characters in the header search or add{" "}
          <code className="rounded bg-muted px-1">?q=</code> to this URL.
        </PageListMeta>
      )}

      {loading && !results && hasQuery ? (
        <div className="mt-6">
          <CardGridSkeleton count={8} />
        </div>
      ) : null}
      {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

      {!loading && hasQuery && results && totalResults === 0 && !error && (
        <p className="mt-6 text-sm text-muted-foreground">No results found.</p>
      )}

      {results && (
        <div className={cn(loading && "opacity-60")} aria-busy={loading || undefined}>
          <ResultSection
            title="Cards"
            count={results.cards.length}
            listClassName={CARD_FACE_GRID_CLASS}
          >
            {results.cards.map((card) => (
              <li key={card.id} className="min-w-0">
                <CardGridTile
                  card={{
                    ...card,
                    listPrice: parseCatalogListPrice(card.prices),
                  }}
                />
              </li>
            ))}
          </ResultSection>

          <ResultSection
            title="Sets"
            count={results.sets.length}
            listClassName={SET_BROWSE_GRID_CLASS}
          >
            {results.sets.map((set) => (
              <SetBrowseRow key={set.code} set={set} />
            ))}
          </ResultSection>
        </div>
      )}
    </PageShell>
  );
}
