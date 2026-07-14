"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { CardFacePlaceholder, CardImage } from "@/components/discovery/card-image";
import { PageListMeta } from "@/components/layout/page-list-meta";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent } from "@/components/ui/card";
import {
  GLOBAL_SEARCH_MIN_QUERY_LENGTH,
  type GlobalSearchResponse,
} from "@/lib/search/types";
import { formatSetType } from "@/lib/scryfall/sets";
import { cn } from "@/lib/utils";

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
        <span className="text-sm font-normal text-muted-foreground">({count})</span>
      </h2>
      <ul className="mt-4 space-y-3">{children}</ul>
    </section>
  );
}

function SearchResultCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card size="sm" className={cn("shadow-sm", className)}>
      <CardContent className="flex items-center gap-4 py-3">{children}</CardContent>
    </Card>
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
        <PageListMeta>
          Enter at least {GLOBAL_SEARCH_MIN_QUERY_LENGTH} characters in the header search or add{" "}
          <code className="rounded bg-muted px-1">?q=</code> to this URL.
        </PageListMeta>
      )}

      {hasQuery && (
        <PageListMeta>
          Results for <span className="font-medium text-foreground">{query}</span>
        </PageListMeta>
      )}

      {loading && <p className="mt-4 text-sm text-muted-foreground">Searching...</p>}
      {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

      {!loading && hasQuery && results && totalResults === 0 && !error && (
        <p className="mt-6 text-sm text-muted-foreground">No results found.</p>
      )}

      {results && (
        <>
          <ResultSection title="Commanders" count={results.commanders.length}>
            {results.commanders.map((commander) => (
              <li key={commander.slug}>
                <SearchResultCard>
                  {commander.imageUri ? (
                    <CardImage src={commander.imageUri} alt="" variant="thumbnail" />
                  ) : (
                    <CardFacePlaceholder />
                  )}
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/commanders/${commander.slug}`}
                      className="font-medium hover:underline"
                    >
                      {commander.name}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      {commander.typeLine ?? "Commander"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {commander.rank != null ? `Rank #${commander.rank}` : "Commander"}
                    </p>
                  </div>
                </SearchResultCard>
              </li>
            ))}
          </ResultSection>

          <ResultSection title="Cards" count={results.cards.length}>
            {results.cards.map((card) => (
              <li key={card.slug ?? card.name}>
                <SearchResultCard>
                  {card.imageUri ? (
                    <CardImage src={card.imageUri} alt="" variant="thumbnail" />
                  ) : (
                    <CardFacePlaceholder />
                  )}
                  <div className="min-w-0 flex-1">
                    {card.slug ? (
                      <Link href={`/cards/${card.slug}`} className="font-medium hover:underline">
                        {card.name}
                      </Link>
                    ) : (
                      <p className="font-medium">{card.name}</p>
                    )}
                    <p className="text-sm text-muted-foreground">{card.typeLine}</p>
                    <p className="text-xs text-muted-foreground">
                      CMC {card.cmc}
                      {card.isCommander ? " · Commander" : ""}
                    </p>
                  </div>
                </SearchResultCard>
              </li>
            ))}
          </ResultSection>

          <ResultSection title="Sets" count={results.sets.length}>
            {results.sets.map((set) => (
              <li key={set.code}>
                <SearchResultCard>
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
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-muted text-xs text-muted-foreground">
                      ?
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <Link href={`/sets/${set.code}`} className="font-medium hover:underline">
                      {set.name}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      {set.code.toUpperCase()} · {formatSetType(set.setType)}
                    </p>
                  </div>
                </SearchResultCard>
              </li>
            ))}
          </ResultSection>
        </>
      )}
    </PageShell>
  );
}
