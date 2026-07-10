"use client";

import { useCallback, useEffect, useState } from "react";

import { BrowseTabs } from "@/components/discovery/browse-tabs";
import {
  buildCommanderBrowseSearchParams,
  CommanderBrowseToolbar,
  defaultCommanderBrowseToolbarState,
  type CommanderBrowseToolbarState,
} from "@/components/discovery/commander-browse-toolbar";
import { CommanderBrowseRow } from "@/components/discovery/commander-browse-row";
import { LoadMoreButton } from "@/components/discovery/load-more-button";
import { PageShell } from "@/components/layout/page-shell";
import type { CommanderBrowseItem, CommanderBrowseTab } from "@/lib/browse/commanders-shared";
import { getCommanderBrowseSortOptions } from "@/lib/browse/commanders-shared";

const COMMANDER_TABS = [
  { id: "ranked", label: "Ranked" },
  { id: "all", label: "All commanders" },
] as const;

export default function CommandersPage() {
  const [tab, setTab] = useState<CommanderBrowseTab>("ranked");
  const [toolbar, setToolbar] = useState<CommanderBrowseToolbarState>(
    defaultCommanderBrowseToolbarState("ranked"),
  );
  const [items, setItems] = useState<CommanderBrowseItem[]>([]);
  const [total, setTotal] = useState(0);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBrowse = useCallback(
    async (options: {
      tab: CommanderBrowseTab;
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
          options.tab,
          options.toolbarState,
          options.cursor,
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
    const nextTab = nextTabId === "all" ? "all" : "ranked";
    setTab(nextTab);
    setItems([]);
    setNextCursor(null);
    setToolbar(defaultCommanderBrowseToolbarState(nextTab));
  }

  function handleToolbarChange(patch: Partial<CommanderBrowseToolbarState>) {
    setToolbar((current) => {
      const next = { ...current, ...patch };

      if (patch.sort) {
        const validSorts = getCommanderBrowseSortOptions(tab).map((option) => option.value);
        if (!validSorts.includes(patch.sort)) {
          next.sort = tab === "ranked" ? "rank" : "numDecks";
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
    tab === "ranked"
      ? "Top commanders by rank."
      : "Full Commander catalog.";

  return (
    <PageShell
      title="Commanders"
      description="Browse ranked commanders or the full Commander catalog."
    >
      <BrowseTabs tabs={[...COMMANDER_TABS]} activeTab={tab} onChange={handleTabChange} />

      <div className="mt-4">
        <CommanderBrowseToolbar tab={tab} state={toolbar} onChange={handleToolbarChange} />
      </div>

      <p className="mt-4 text-sm text-zinc-500">
        {tabDescription}
        {total > 0 ? ` Showing ${items.length.toLocaleString()} of ${total.toLocaleString()}.` : ""}
      </p>

      {loading && <p className="mt-4 text-sm text-zinc-500">Loading...</p>}
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <ul className="mt-6 space-y-3">
        {items.map((commander) => (
          <CommanderBrowseRow
            key={commander.slug}
            commander={commander}
            showCoverageBadge={tab === "all"}
          />
        ))}
      </ul>

      {!loading && items.length === 0 && !error && (
        <p className="mt-6 text-sm text-zinc-500">
          {tab === "ranked"
            ? "No ranked commanders match these filters."
            : "No commanders match these filters."}
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
