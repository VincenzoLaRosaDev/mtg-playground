"use client";

import { useCallback, useEffect, useState } from "react";

import { LoadMoreButton } from "@/components/discovery/load-more-button";
import {
  buildSetBrowseSearchParams,
  defaultSetBrowseToolbarState,
  SetBrowseToolbar,
  type SetBrowseToolbarState,
} from "@/components/discovery/set-browse-toolbar";
import { SetBrowseRow } from "@/components/discovery/set-browse-row";
import { EmptyState } from "@/components/discovery/empty-state";
import { PageListMeta } from "@/components/layout/page-list-meta";
import { PageShell } from "@/components/layout/page-shell";
import type { SetBrowseItem } from "@/lib/browse/sets-shared";
import { defaultSetBrowseOrder, getSetBrowseSortOptions } from "@/lib/browse/sets-shared";
import { SET_BROWSE_GRID_CLASS } from "@/lib/ui/card-face";

export default function SetsPage() {
  const [toolbar, setToolbar] = useState<SetBrowseToolbarState>(defaultSetBrowseToolbarState());
  const [items, setItems] = useState<SetBrowseItem[]>([]);
  const [total, setTotal] = useState(0);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBrowse = useCallback(
    async (options: {
      toolbarState: SetBrowseToolbarState;
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
        const params = buildSetBrowseSearchParams(options.toolbarState, options.cursor);

        const response = await fetch(`/api/sets/search?${params.toString()}`, {
          signal: options.signal,
        });

        if (!response.ok) {
          throw new Error("Failed to load sets");
        }

        const data = (await response.json()) as {
          items: SetBrowseItem[];
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

  function handleToolbarChange(patch: Partial<SetBrowseToolbarState>) {
    setToolbar((current) => {
      const next = { ...current, ...patch };

      if (patch.sort) {
        const validSorts = getSetBrowseSortOptions().map((option) => option.value);
        if (!validSorts.includes(patch.sort)) {
          next.sort = defaultSetBrowseToolbarState().sort;
        } else if (patch.order == null) {
          next.order = defaultSetBrowseOrder(patch.sort);
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
      toolbarState: toolbar,
      cursor: nextCursor,
      append: true,
    });
  }

  return (
    <PageShell
      title="Sets"
      description="Browse Magic sets by release date, type, and indexed card coverage."
      toolbar={<SetBrowseToolbar state={toolbar} onChange={handleToolbarChange} />}
    >
      <PageListMeta>
        Recent sets by default; filter by type, digital/paper, or indexed card lists.
        {total > 0 ? ` Showing ${items.length.toLocaleString()} of ${total.toLocaleString()}.` : ""}
      </PageListMeta>

      {loading && <p className="mt-4 text-sm text-muted-foreground">Loading...</p>}
      {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

      <ul className={`mt-6 ${SET_BROWSE_GRID_CLASS}`}>
        {items.map((set) => (
          <SetBrowseRow key={set.code} set={set} />
        ))}
      </ul>

      {!loading && items.length === 0 && !error && (
        <EmptyState
          className="mt-6"
          title={
            toolbar.query.trim().length >= 2 ? "No sets match these filters" : "No set data yet"
          }
          description={
            toolbar.query.trim().length >= 2
              ? "Try a different name, code, or filter."
              : "Run sync:scryfall-sets to load set metadata."
          }
        />
      )}

      <LoadMoreButton
        onClick={handleLoadMore}
        loading={loadingMore}
        disabled={!nextCursor || loading}
      />
    </PageShell>
  );
}
