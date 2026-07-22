"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";

import { CardFacePlaceholder, CardImage } from "@/components/discovery/card-image";
import { SearchHitListSkeleton } from "@/components/discovery/loading-skeletons";
import { SetIcon } from "@/components/mtg/set-icon";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  GLOBAL_SEARCH_DEFAULT_LIMIT,
  GLOBAL_SEARCH_MIN_QUERY_LENGTH,
  type GlobalSearchResponse,
} from "@/lib/search/types";
import { CARD_TEXT_SEARCH_PLACEHOLDER } from "@/lib/search/card-text-search";
import { formatSetType } from "@/lib/scryfall/sets";

const DEBOUNCE_MS = 250;
const DROPDOWN_LIMIT = GLOBAL_SEARCH_DEFAULT_LIMIT;

function hasResults(data: GlobalSearchResponse): boolean {
  return data.cards.length > 0 || data.sets.length > 0;
}

function SearchSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-t border-border first:border-t-0">
      <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      <ul>{children}</ul>
    </div>
  );
}

function SearchResultLink({
  href,
  onSelect,
  children,
}: {
  href: string;
  onSelect: () => void;
  children: React.ReactNode;
}) {
  return (
    <li>
      <Link
        href={href}
        onClick={onSelect}
        className="flex cursor-pointer items-center gap-3 px-3 py-2 text-sm hover:bg-accent"
      >
        {children}
      </Link>
    </li>
  );
}

export function GlobalSearch() {
  const router = useRouter();
  const listboxId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GlobalSearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const closeDropdown = useCallback(() => {
    setOpen(false);
  }, []);

  const fetchResults = useCallback(async (searchQuery: string, signal?: AbortSignal) => {
    if (searchQuery.trim().length < GLOBAL_SEARCH_MIN_QUERY_LENGTH) {
      setResults(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const params = new URLSearchParams({
        q: searchQuery.trim(),
        limit: String(DROPDOWN_LIMIT),
      });

      const response = await fetch(`/api/search?${params.toString()}`, { signal });

      if (!response.ok) {
        throw new Error("Search failed");
      }

      const data = (await response.json()) as GlobalSearchResponse;
      setResults(data);
      setOpen(true);
    } catch (error) {
      if (error instanceof Error && error.name !== "AbortError") {
        setResults(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      void fetchResults(query, controller.signal);
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [fetchResults, query]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        closeDropdown();
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [closeDropdown]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = query.trim();

    if (trimmed.length < GLOBAL_SEARCH_MIN_QUERY_LENGTH) {
      return;
    }

    closeDropdown();
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  }

  function handleSelect() {
    closeDropdown();
    setQuery("");
    setResults(null);
  }

  const showDropdown =
    open && query.trim().length >= GLOBAL_SEARCH_MIN_QUERY_LENGTH && (loading || results != null);

  return (
    <div ref={containerRef} className="relative w-full">
      <form onSubmit={handleSubmit} role="search">
        <label htmlFor="global-search" className="sr-only">
          Search cards and sets
        </label>
        <div className="relative">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            id="global-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onFocus={() => {
              if (results && query.trim().length >= GLOBAL_SEARCH_MIN_QUERY_LENGTH) {
                setOpen(true);
              }
            }}
            placeholder={`${CARD_TEXT_SEARCH_PLACEHOLDER} + sets`}
            autoComplete="off"
            role="combobox"
            aria-expanded={showDropdown}
            aria-controls={showDropdown ? listboxId : undefined}
            className="pl-9"
          />
        </div>
      </form>

      {showDropdown && (
        <div
          id={listboxId}
          role="listbox"
          className="absolute z-50 mt-2 max-h-[min(70vh,24rem)] w-full overflow-y-auto rounded-lg border border-border bg-popover text-popover-foreground shadow-lg"
        >
          {loading && !results ? (
            <div className="px-2 py-2">
              <SearchHitListSkeleton count={DROPDOWN_LIMIT} />
            </div>
          ) : null}

          {!loading && results && !hasResults(results) && (
            <p className="px-3 py-3 text-sm text-muted-foreground">No results found.</p>
          )}

          {results && hasResults(results) && (
            <div className={cn(loading && "opacity-60")} aria-busy={loading || undefined}>
              {results.cards.length > 0 && (
                <SearchSection title="Cards">
                  {results.cards.map((card) => {
                    const href = card.slug ? `/cards/${card.slug}` : null;

                    if (!href) {
                      return (
                        <li
                          key={card.name}
                          className="flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground"
                        >
                          {card.name}
                        </li>
                      );
                    }

                    return (
                      <SearchResultLink
                        key={`${card.slug}-${card.name}`}
                        href={href}
                        onSelect={handleSelect}
                      >
                        {card.imageUri ? (
                          <CardImage src={card.imageUri} alt="" variant="thumbnail" />
                        ) : (
                          <CardFacePlaceholder />
                        )}
                        <span className="min-w-0">
                          <span className="block truncate font-medium">{card.name}</span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {card.typeLine}
                            {card.isCommander ? " · Legal commander" : ""}
                          </span>
                        </span>
                      </SearchResultLink>
                    );
                  })}
                </SearchSection>
              )}

              {results.sets.length > 0 && (
                <SearchSection title="Sets">
                  {results.sets.map((set) => (
                    <SearchResultLink
                      key={set.code}
                      href={`/sets/${set.code}`}
                      onSelect={handleSelect}
                    >
                      {set.iconUri ? (
                        <SetIcon src={set.iconUri} className="h-6 w-6" />
                      ) : (
                        <span className="inline-block h-6 w-6 shrink-0 rounded bg-muted" />
                      )}
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{set.name}</span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {set.code.toUpperCase()} · {formatSetType(set.setType)}
                        </span>
                      </span>
                    </SearchResultLink>
                  ))}
                </SearchSection>
              )}

              <div className="border-t border-border p-2">
                <Link
                  href={`/search?q=${encodeURIComponent(results.query)}`}
                  onClick={handleSelect}
                  className="block rounded-md px-3 py-2 text-center text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  View all results
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
