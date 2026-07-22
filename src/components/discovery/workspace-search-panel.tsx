"use client";

import { Search } from "lucide-react";
import { useCallback, useEffect, useId, useState, type ReactNode } from "react";

import { CardFaceTile } from "@/components/discovery/card-face-tile";
import { EntityPreviewFooter } from "@/components/discovery/entity-preview-footer";
import { CardGridSkeleton } from "@/components/discovery/loading-skeletons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CARD_TEXT_SEARCH_PLACEHOLDER } from "@/lib/search/card-text-search";
import {
  GLOBAL_SEARCH_MIN_QUERY_LENGTH,
  type GlobalSearchCardResult,
  type GlobalSearchResponse,
} from "@/lib/search/types";
import { CARD_FACE_GRID_CLASS } from "@/lib/ui/card-face";
import { SITE_GUTTER_BLEED_X_CLASS, SHEET_LIST_RULE_CLASS } from "@/lib/ui/layout";
import { cn } from "@/lib/utils";

const DEBOUNCE_MS = 250;
const RESULT_LIMIT = 20;

export type WorkspaceSearchPickMode = "button" | "tile";

type WorkspaceSearchPanelProps = {
  /** Called when the user picks a card from results. */
  onSelectCard: (card: GlobalSearchCardResult) => void;
  /** Optional: open CardPeek for the hit. */
  onPeekCard?: (card: GlobalSearchCardResult) => void;
  /** Extra actions under each hit (e.g. qty). */
  renderCardActions?: (card: GlobalSearchCardResult) => ReactNode;
  /**
   * `button` — explicit Add control (deck default).
   * `tile` — whole card is the hit target (collection add).
   */
  pickMode?: WorkspaceSearchPickMode;
  /** When false, skip fetching (e.g. sheet closed / other step). */
  active?: boolean;
  className?: string;
};

/**
 * Catalog FTS results body for workspace sheets (collection / deck).
 * Host owns the Sheet chrome.
 */
export function WorkspaceSearchPanel({
  onSelectCard,
  onPeekCard,
  renderCardActions,
  pickMode = "button",
  active = true,
  className,
}: WorkspaceSearchPanelProps) {
  const listboxId = useId();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GlobalSearchResponse | null>(null);
  const [loading, setLoading] = useState(false);

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
        limit: String(RESULT_LIMIT),
      });
      const response = await fetch(`/api/search?${params.toString()}`, { signal });
      if (!response.ok) throw new Error("Search failed");
      const data = (await response.json()) as GlobalSearchResponse;
      setResults(data);
    } catch (error) {
      if (error instanceof Error && error.name !== "AbortError") {
        setResults(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!active) return;
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      void fetchResults(query, controller.signal);
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [query, active, fetchResults]);

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col", className)}>
      <div
        className={cn(
          "shrink-0 pt-2 pb-4",
          SHEET_LIST_RULE_CLASS,
          SITE_GUTTER_BLEED_X_CLASS,
        )}
      >
        <div className="relative">
          <Search
            className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={CARD_TEXT_SEARCH_PLACEHOLDER}
            className="pl-9"
            aria-controls={listboxId}
            aria-autocomplete="list"
            autoFocus={active}
          />
        </div>
      </div>

      <div
        id={listboxId}
        role="listbox"
        className="min-h-0 flex-1 overflow-y-auto py-4 pb-8"
      >
        {loading && !results ? <CardGridSkeleton count={10} /> : null}

        {!loading &&
        query.trim().length >= GLOBAL_SEARCH_MIN_QUERY_LENGTH &&
        results &&
        results.cards.length === 0 ? (
          <p className="text-sm text-muted-foreground">No cards found.</p>
        ) : null}

        {results && results.cards.length > 0 ? (
          <ul
            className={cn(CARD_FACE_GRID_CLASS, loading && "opacity-60")}
            aria-busy={loading || undefined}
          >
            {results.cards.map((card) => {
              const footer = (
                <div className="space-y-2 text-sm">
                  <div className="min-w-0">
                    <p className="line-clamp-2 font-medium">{card.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{card.typeLine}</p>
                  </div>
                  <EntityPreviewFooter
                    prices={card.prices}
                    popularityRank={card.popularityRank}
                    frictionScore={card.frictionScore}
                  />
                  {pickMode === "button" || onPeekCard || renderCardActions ? (
                    <div className="flex flex-wrap items-center gap-1.5">
                      {renderCardActions?.(card)}
                      {onPeekCard ? (
                        <Button
                          type="button"
                          size="xs"
                          variant="outline"
                          onClick={(event) => {
                            event.stopPropagation();
                            onPeekCard(card);
                          }}
                        >
                          Peek
                        </Button>
                      ) : null}
                      {pickMode === "button" ? (
                        <Button type="button" size="xs" onClick={() => onSelectCard(card)}>
                          Add
                        </Button>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              );

              const tile = (
                <CardFaceTile
                  imageUri={card.imageUri}
                  faces={card.faces}
                  name={card.name}
                  footer={footer}
                />
              );

              return (
                <li key={card.id} role="option">
                  {pickMode === "tile" ? (
                    <button
                      type="button"
                      className="w-full cursor-pointer rounded-lg text-left outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                      onClick={() => onSelectCard(card)}
                      aria-label={`Select ${card.name}`}
                    >
                      {tile}
                    </button>
                  ) : (
                    tile
                  )}
                </li>
              );
            })}
          </ul>
        ) : null}

        {!loading && query.trim().length < GLOBAL_SEARCH_MIN_QUERY_LENGTH ? (
          <p className="text-sm text-muted-foreground">
            Type at least {GLOBAL_SEARCH_MIN_QUERY_LENGTH} characters.
          </p>
        ) : null}
      </div>
    </div>
  );
}
