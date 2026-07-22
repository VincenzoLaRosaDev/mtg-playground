"use client";

import { Search } from "lucide-react";
import { useCallback, useEffect, useId, useState, type ReactNode } from "react";

import { CardFacePlaceholder, CardImage } from "@/components/discovery/card-image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/ui/icon";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { CARD_TEXT_SEARCH_PLACEHOLDER } from "@/lib/search/card-text-search";
import {
  GLOBAL_SEARCH_MIN_QUERY_LENGTH,
  type GlobalSearchCardResult,
  type GlobalSearchResponse,
} from "@/lib/search/types";
import { cn } from "@/lib/utils";

const DEBOUNCE_MS = 250;
const RESULT_LIMIT = 12;

type WorkspaceSearchOverlayProps = {
  /** Called when the user adds a card from results (deck / collection host). */
  onAddCard: (card: GlobalSearchCardResult) => void;
  /** Optional: open CardPeek for the hit. */
  onPeekCard?: (card: GlobalSearchCardResult) => void;
  /** Extra actions under each hit (e.g. qty). */
  renderCardActions?: (card: GlobalSearchCardResult) => ReactNode;
  title?: string;
  description?: string;
  triggerLabel?: string;
  className?: string;
};

/**
 * Contextual catalog search for workspaces (deck editor, later collection).
 * Reuses `/api/search` FTS; does not navigate away — host handles Add / peek.
 */
export function WorkspaceSearchOverlay({
  onAddCard,
  onPeekCard,
  renderCardActions,
  title = "Add cards",
  description = "Search the catalog and add cards without leaving this page.",
  triggerLabel = "Search cards",
  className,
}: WorkspaceSearchOverlayProps) {
  const listboxId = useId();
  const [open, setOpen] = useState(false);
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
    if (!open) return;
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      void fetchResults(query, controller.signal);
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [query, open, fetchResults]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button type="button" variant="outline" className={cn("gap-2", className)} />
        }
      >
        <Search className="size-4" aria-hidden />
        {triggerLabel}
      </SheetTrigger>

      <SheetContent side="bottom" className="max-h-[85dvh] gap-0 overflow-hidden p-0">
        <SheetHeader className="shrink-0 border-b border-border px-4 py-4 sm:px-6">
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
          <div className="relative pt-2">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={CARD_TEXT_SEARCH_PLACEHOLDER}
              className="pl-9"
              aria-controls={listboxId}
              aria-autocomplete="list"
              autoFocus
            />
          </div>
        </SheetHeader>

        <div id={listboxId} role="listbox" className="min-h-0 flex-1 overflow-y-auto px-2 py-2 sm:px-4">
          {loading ? (
            <p className="flex items-center gap-2 px-3 py-4 text-sm text-muted-foreground">
              <LoadingSpinner className="size-4" /> Searching…
            </p>
          ) : null}

          {!loading &&
          query.trim().length >= GLOBAL_SEARCH_MIN_QUERY_LENGTH &&
          results &&
          results.cards.length === 0 ? (
            <p className="px-3 py-4 text-sm text-muted-foreground">No cards found.</p>
          ) : null}

          {results && results.cards.length > 0 ? (
            <ul className="space-y-1 pb-6">
              {results.cards.map((card) => (
                <li
                  key={card.id}
                  className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-accent"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    {card.imageUri ? (
                      <CardImage src={card.imageUri} alt={card.name} variant="thumbnail" />
                    ) : (
                      <CardFacePlaceholder variant="thumbnail" />
                    )}
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">{card.name}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {card.typeLine}
                      </span>
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {renderCardActions?.(card)}
                    {onPeekCard ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => onPeekCard(card)}
                      >
                        Peek
                      </Button>
                    ) : null}
                    <Button type="button" size="sm" onClick={() => onAddCard(card)}>
                      Add
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          ) : null}

          {!loading && query.trim().length < GLOBAL_SEARCH_MIN_QUERY_LENGTH ? (
            <p className="px-3 py-4 text-sm text-muted-foreground">
              Type at least {GLOBAL_SEARCH_MIN_QUERY_LENGTH} characters.
            </p>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
