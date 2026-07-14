"use client";

import { useCallback, useEffect, useState } from "react";

import {
  buildCardBrowseSearchParams,
  CardBrowseToolbar,
  defaultCardBrowseToolbarState,
  type CardBrowseToolbarState,
} from "@/components/discovery/card-browse-toolbar";
import { CardGridTile } from "@/components/discovery/card-grid-tile";
import { LoadMoreButton } from "@/components/discovery/load-more-button";
import { PopularityUnavailableBadge } from "@/components/discovery/popularity-unavailable-badge";
import { TopWindowSelector } from "@/components/discovery/top-window-selector";
import { PageListMeta } from "@/components/layout/page-list-meta";
import { PageShell } from "@/components/layout/page-shell";
import type { CardBrowseItem } from "@/lib/browse/cards-shared";
import { defaultOrderForTab, defaultSortForTab, getCardBrowseSortOptions } from "@/lib/browse/cards-shared";
import type { BrowseListMeta } from "@/lib/browse/types";
import { DEFAULT_EDHREC_CARD_TOP_WINDOW, type EdhrecCardTopWindowParam } from "@/lib/edhrec/top-window";
import { CARD_FACE_GRID_CLASS } from "@/lib/ui/card-face";

export default function CardsPage() {
  const [window, setWindow] = useState<EdhrecCardTopWindowParam>(DEFAULT_EDHREC_CARD_TOP_WINDOW);
  const [toolbar, setToolbar] = useState<CardBrowseToolbarState>(
    defaultCardBrowseToolbarState(DEFAULT_EDHREC_CARD_TOP_WINDOW),
  );
  const [items, setItems] = useState<CardBrowseItem[]>([]);
  const [total, setTotal] = useState(0);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [meta, setMeta] = useState<BrowseListMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBrowse = useCallback(
    async (options: {
      window: EdhrecCardTopWindowParam;
      toolbarState: CardBrowseToolbarState;
      cursor?: string | null;
      append?: boolean;
      signal?: AbortSignal;
    }) => {
      const isAppend = options.append === true;

      if (isAppend) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError(null);

      try {
        const params = buildCardBrowseSearchParams(
          options.toolbarState,
          options.cursor,
          options.window,
        );

        const response = await fetch(`/api/cards/browse?${params.toString()}`, {
          signal: options.signal,
        });

        if (!response.ok) {
          throw new Error("Failed to load cards");
        }

        const data = (await response.json()) as {
          items: CardBrowseItem[];
          total: number;
          nextCursor: string | null;
          meta?: BrowseListMeta;
        };

        setTotal(data.total);
        setNextCursor(data.nextCursor);
        setMeta(data.meta ?? null);
        setItems((current) => (isAppend ? [...current, ...data.items] : data.items));
      } catch (err) {
        if (err instanceof Error && err.name !== "AbortError") {
          setError(err.message);
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [],
  );

  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      void fetchBrowse({
        window,
        toolbarState: toolbar,
        signal: controller.signal,
      });
    }, toolbar.query.trim().length >= 2 ? 250 : 0);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [fetchBrowse, toolbar, window]);

  function handleToolbarChange(patch: Partial<CardBrowseToolbarState>) {
    setToolbar((current) => {
      const next = { ...current, ...patch };

      if (patch.sort) {
        const validSorts = getCardBrowseSortOptions().map((option) => option.value);
        if (!validSorts.includes(patch.sort)) {
          next.sort = defaultSortForTab();
          next.order = defaultOrderForTab(next.sort);
        }
      }

      if (patch.sort && !patch.order) {
        next.order = defaultOrderForTab(next.sort);
      }

      return next;
    });
    setItems([]);
    setNextCursor(null);
  }

  function handleWindowChange(nextWindow: EdhrecCardTopWindowParam) {
    setWindow(nextWindow);
    const sort = defaultSortForTab();
    setToolbar((current) => ({
      ...current,
      sort,
      order: defaultOrderForTab(sort),
    }));
    setItems([]);
    setNextCursor(null);
  }

  function handleLoadMore() {
    if (!nextCursor || loadingMore) return;

    void fetchBrowse({
      window,
      toolbarState: toolbar,
      cursor: nextCursor,
      append: true,
    });
  }

  const showPopularityUnavailable = meta?.popularityDataAvailable === false;

  return (
    <PageShell
      title="Top cards"
      description="Most played cards in Commander decks, by EDHREC popularity."
      toolbar={
        <>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <TopWindowSelector
              value={window}
              onChange={(nextWindow) => {
                if (nextWindow !== "all") {
                  handleWindowChange(nextWindow);
                }
              }}
              includeAllTime={false}
            />
            {showPopularityUnavailable && <PopularityUnavailableBadge />}
          </div>
          <CardBrowseToolbar state={toolbar} onChange={handleToolbarChange} />
        </>
      }
    >
      <PageListMeta>
        EDHREC top cards for the selected time window.
        {total > 0 ? ` Showing ${items.length.toLocaleString()} of ${total.toLocaleString()}.` : ""}
      </PageListMeta>

      {loading && <p className="mt-4 text-sm text-muted-foreground">Loading...</p>}
      {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

      <div className={`mt-6 ${CARD_FACE_GRID_CLASS}`}>
        {items.map((card) => (
          <CardGridTile key={card.id} card={card} />
        ))}
      </div>

      {!loading && items.length === 0 && !error && (
        <p className="mt-6 text-sm text-muted-foreground">No cards match these filters.</p>
      )}

      <LoadMoreButton
        onClick={handleLoadMore}
        loading={loadingMore}
        disabled={!nextCursor || loading}
      />
    </PageShell>
  );
}
