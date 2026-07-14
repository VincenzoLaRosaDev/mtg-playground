"use client";

import { useCallback, useEffect, useState } from "react";

import {
  buildCatalogBrowseSearchParams,
  CatalogBrowseToolbar,
  defaultCatalogBrowseToolbarState,
  type CatalogBrowseToolbarState,
} from "@/components/discovery/catalog-browse-toolbar";
import { CardGridTile } from "@/components/discovery/card-grid-tile";
import { LoadMoreButton } from "@/components/discovery/load-more-button";
import { PageListMeta } from "@/components/layout/page-list-meta";
import { PageShell } from "@/components/layout/page-shell";
import type { CardBrowseItem } from "@/lib/browse/cards-shared";
import { defaultCatalogOrder, defaultCatalogSort, getCatalogBrowseSortOptions } from "@/lib/browse/cards-shared";
import { CARD_FACE_GRID_CLASS } from "@/lib/ui/card-face";

export default function CatalogPage() {
  const [toolbar, setToolbar] = useState<CatalogBrowseToolbarState>(defaultCatalogBrowseToolbarState());
  const [items, setItems] = useState<CardBrowseItem[]>([]);
  const [total, setTotal] = useState(0);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBrowse = useCallback(
    async (options: {
      toolbarState: CatalogBrowseToolbarState;
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
        const params = buildCatalogBrowseSearchParams(options.toolbarState, options.cursor);

        const response = await fetch(`/api/cards/browse?${params.toString()}`, {
          signal: options.signal,
        });

        if (!response.ok) {
          throw new Error("Failed to load catalog");
        }

        const data = (await response.json()) as {
          items: CardBrowseItem[];
          total: number;
          nextCursor: string | null;
        };

        setTotal(data.total);
        setNextCursor(data.nextCursor);
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
        toolbarState: toolbar,
        signal: controller.signal,
      });
    }, toolbar.query.trim().length >= 2 ? 250 : 0);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [fetchBrowse, toolbar]);

  function handleToolbarChange(patch: Partial<CatalogBrowseToolbarState>) {
    setToolbar((current) => {
      const next = { ...current, ...patch };

      if (patch.sort) {
        const validSorts = getCatalogBrowseSortOptions().map((option) => option.value);
        if (!validSorts.includes(patch.sort)) {
          next.sort = defaultCatalogSort();
          next.order = defaultCatalogOrder(next.sort);
        }
      }

      if (patch.sort && !patch.order) {
        next.order = defaultCatalogOrder(next.sort);
      }

      return next;
    });
    setItems([]);
    setNextCursor(null);
  }

  function handleLoadMore() {
    if (!nextCursor || loadingMore) return;

    void fetchBrowse({
      toolbarState: toolbar,
      cursor: nextCursor,
      append: true,
    });
  }

  const description = toolbar.commandersOnly
    ? "Browse every commander in the Scryfall catalog."
    : "Browse the full Commander-legal card catalog from Scryfall.";

  return (
    <PageShell
      title="Catalog"
      description={description}
      toolbar={<CatalogBrowseToolbar state={toolbar} onChange={handleToolbarChange} />}
    >
      <PageListMeta>
        Scryfall catalog — no EDHREC popularity ranking.
        {total > 0 ? ` Showing ${items.length.toLocaleString()} of ${total.toLocaleString()}.` : ""}
      </PageListMeta>

      {loading && <p className="mt-4 text-sm text-muted-foreground">Loading...</p>}
      {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

      <div className={`mt-6 ${CARD_FACE_GRID_CLASS}`}>
        {items.map((card) => (
          <CardGridTile
            key={card.id}
            card={card}
            showRank={false}
            preferCommanderLink
          />
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
