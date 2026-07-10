"use client";

import { useCallback, useEffect, useState } from "react";

import { BrowseTabs } from "@/components/discovery/browse-tabs";
import {
  buildCardBrowseSearchParams,
  CardBrowseToolbar,
  defaultCardBrowseToolbarState,
  type CardBrowseToolbarState,
} from "@/components/discovery/card-browse-toolbar";
import { CardBrowseRow } from "@/components/discovery/card-browse-row";
import { LoadMoreButton } from "@/components/discovery/load-more-button";
import { PageShell } from "@/components/layout/page-shell";
import type { CardBrowseItem, CardBrowseTab } from "@/lib/browse/cards-shared";
import { getCardBrowseSortOptions } from "@/lib/browse/cards-shared";

const CARD_TABS = [
  { id: "popular", label: "Popular" },
  { id: "all", label: "All cards" },
] as const;

export default function CardsPage() {
  const [tab, setTab] = useState<CardBrowseTab>("popular");
  const [toolbar, setToolbar] = useState<CardBrowseToolbarState>(
    defaultCardBrowseToolbarState("popular"),
  );
  const [items, setItems] = useState<CardBrowseItem[]>([]);
  const [total, setTotal] = useState(0);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBrowse = useCallback(
    async (options: {
      tab: CardBrowseTab;
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
          options.tab,
          options.toolbarState,
          options.cursor,
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
        tab,
        toolbarState: toolbar,
        signal: controller.signal,
      });
    }, toolbar.query.trim().length >= 2 ? 250 : 0);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [fetchBrowse, tab, toolbar]);

  function handleTabChange(nextTabId: string) {
    const nextTab = nextTabId === "all" ? "all" : "popular";
    setTab(nextTab);
    setItems([]);
    setNextCursor(null);
    setToolbar(defaultCardBrowseToolbarState(nextTab));
  }

  function handleToolbarChange(patch: Partial<CardBrowseToolbarState>) {
    setToolbar((current) => {
      const next = { ...current, ...patch };

      if (patch.sort) {
        const validSorts = getCardBrowseSortOptions(tab).map((option) => option.value);
        if (!validSorts.includes(patch.sort)) {
          next.sort = tab === "popular" ? "inclusion" : "name";
        }
      }

      return next;
    });
    setItems([]);
    setNextCursor(null);
  }

  function handleLoadMore() {
    if (!nextCursor || loadingMore) return;

    void fetchBrowse({
      tab,
      toolbarState: toolbar,
      cursor: nextCursor,
      append: true,
    });
  }

  const tabDescription =
    tab === "popular"
      ? "Top cards by deck inclusion."
      : "Full playable catalog.";

  return (
    <PageShell
      title="Cards"
      description="Browse popular staples or the full Commander catalog."
    >
      <BrowseTabs tabs={[...CARD_TABS]} activeTab={tab} onChange={handleTabChange} />

      <div className="mt-4">
        <CardBrowseToolbar tab={tab} state={toolbar} onChange={handleToolbarChange} />
      </div>

      <p className="mt-4 text-sm text-zinc-500">
        {tabDescription}
        {total > 0 ? ` Showing ${items.length.toLocaleString()} of ${total.toLocaleString()}.` : ""}
      </p>

      {loading && <p className="mt-4 text-sm text-zinc-500">Loading...</p>}
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <ul className="mt-6 space-y-3">
        {items.map((card) => (
          <CardBrowseRow key={card.id} card={card} showCoverageBadge={tab === "all"} />
        ))}
      </ul>

      {!loading && items.length === 0 && !error && (
        <p className="mt-6 text-sm text-zinc-500">
          {tab === "popular"
            ? "No popular cards match these filters."
            : "No cards match these filters."}
        </p>
      )}

      <LoadMoreButton
        onClick={handleLoadMore}
        loading={loadingMore}
        disabled={!nextCursor || loading}
      />
    </PageShell>
  );
}
