"use client";

import { useCallback, useEffect, useState } from "react";

import {
  buildCommanderBrowseSearchParams,
  CommanderBrowseToolbar,
  defaultCommanderBrowseToolbarState,
  type CommanderBrowseToolbarState,
} from "@/components/discovery/commander-browse-toolbar";
import { CommanderGridTile } from "@/components/discovery/commander-grid-tile";
import { LoadMoreButton } from "@/components/discovery/load-more-button";
import { PopularityUnavailableBadge } from "@/components/discovery/popularity-unavailable-badge";
import { TopWindowSelector } from "@/components/discovery/top-window-selector";
import { PageListMeta } from "@/components/layout/page-list-meta";
import { PageShell } from "@/components/layout/page-shell";
import type { CommanderBrowseItem } from "@/lib/browse/commanders-shared";
import { getCommanderBrowseSortOptions } from "@/lib/browse/commanders-shared";
import type { BrowseListMeta } from "@/lib/browse/types";
import { DEFAULT_EDHREC_TOP_WINDOW, type EdhrecTopWindowParam } from "@/lib/edhrec/top-window";
import { CARD_FACE_GRID_CLASS } from "@/lib/ui/card-face";

export default function CommandersPage() {
  const [window, setWindow] = useState<EdhrecTopWindowParam>(DEFAULT_EDHREC_TOP_WINDOW);
  const [toolbar, setToolbar] = useState<CommanderBrowseToolbarState>(
    defaultCommanderBrowseToolbarState(),
  );
  const [items, setItems] = useState<CommanderBrowseItem[]>([]);
  const [total, setTotal] = useState(0);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [meta, setMeta] = useState<BrowseListMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBrowse = useCallback(
    async (options: {
      window: EdhrecTopWindowParam;
      toolbarState: CommanderBrowseToolbarState;
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
        const params = buildCommanderBrowseSearchParams(
          options.toolbarState,
          options.cursor,
          options.window,
        );

        const response = await fetch(`/api/commanders/browse?${params.toString()}`, {
          signal: options.signal,
        });

        if (!response.ok) {
          throw new Error("Failed to load commanders");
        }

        const data = (await response.json()) as {
          items: CommanderBrowseItem[];
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

  function handleToolbarChange(patch: Partial<CommanderBrowseToolbarState>) {
    setToolbar((current) => {
      const next = { ...current, ...patch };

      if (patch.sort) {
        const validSorts = getCommanderBrowseSortOptions().map((option) => option.value);
        if (!validSorts.includes(patch.sort)) {
          next.sort = "rank";
        }
      }

      return next;
    });
    setItems([]);
    setNextCursor(null);
  }

  function handleWindowChange(nextWindow: EdhrecTopWindowParam) {
    setWindow(nextWindow);
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
      title="Top commanders"
      description="Most popular commanders in Commander, by EDHREC rank and deck count."
      toolbar={
        <>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <TopWindowSelector value={window} onChange={handleWindowChange} />
            {showPopularityUnavailable && <PopularityUnavailableBadge />}
          </div>
          <CommanderBrowseToolbar state={toolbar} onChange={handleToolbarChange} />
        </>
      }
    >
      <PageListMeta>
        EDHREC top commanders for the selected time window.
        {total > 0 ? ` Showing ${items.length.toLocaleString()} of ${total.toLocaleString()}.` : ""}
      </PageListMeta>

      {loading && <p className="mt-4 text-sm text-muted-foreground">Loading...</p>}
      {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

      <div className={`mt-6 ${CARD_FACE_GRID_CLASS}`}>
        {items.map((commander) => (
          <CommanderGridTile key={commander.slug} commander={commander} />
        ))}
      </div>

      {!loading && items.length === 0 && !error && (
        <p className="mt-6 text-sm text-muted-foreground">No commanders match these filters.</p>
      )}

      <LoadMoreButton
        onClick={handleLoadMore}
        loading={loadingMore}
        disabled={!nextCursor || loading}
      />
    </PageShell>
  );
}
