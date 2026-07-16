"use client";

import { useState } from "react";

import {
  buildCommanderBrowseSearchParams,
  CommanderBrowseToolbar,
  type CommanderBrowseToolbarState,
} from "@/components/discovery/commander-browse-toolbar";
import { CommanderGridTile } from "@/components/discovery/commander-grid-tile";
import { LoadMoreButton } from "@/components/discovery/load-more-button";
import { PopularityUnavailableBadge } from "@/components/discovery/popularity-unavailable-badge";
import { TopWindowSelector } from "@/components/discovery/top-window-selector";
import { PageListMeta } from "@/components/layout/page-list-meta";
import { PageShell } from "@/components/layout/page-shell";
import { useBrowseList, type BrowseListInitialData } from "@/hooks/use-browse-list";
import type { CommandersBrowseToolbarSnapshot } from "@/lib/browse/commanders-defaults";
import type { CommanderBrowseItem } from "@/lib/browse/commanders-shared";
import { getCommanderBrowseSortOptions } from "@/lib/browse/commanders-shared";
import type { EdhrecTopWindowParam } from "@/lib/edhrec/top-window";
import { CARD_FACE_GRID_CLASS } from "@/lib/ui/card-face";

type CommandersBrowseClientProps = {
  initialData: BrowseListInitialData<CommanderBrowseItem>;
  initialWindow: EdhrecTopWindowParam;
  initialToolbar: CommandersBrowseToolbarSnapshot;
  initialRequestKey: string;
};

export function CommandersBrowseClient({
  initialData,
  initialWindow,
  initialToolbar,
  initialRequestKey,
}: CommandersBrowseClientProps) {
  const [window, setWindow] = useState<EdhrecTopWindowParam>(initialWindow);
  const [toolbar, setToolbar] = useState<CommanderBrowseToolbarState>(initialToolbar);

  const { items, total, nextCursor, meta, loading, loadingMore, error, loadMore } =
    useBrowseList<CommanderBrowseItem>({
      path: "/api/commanders/browse",
      requestKey: JSON.stringify({ window, toolbar }),
      initialRequestKey,
      initialData,
      searchQuery: toolbar.query,
      errorMessage: "Failed to load commanders",
      buildSearchParams: (cursor) => buildCommanderBrowseSearchParams(toolbar, cursor, window),
    });

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
  }

  const showPopularityUnavailable = meta?.popularityDataAvailable === false;

  return (
    <PageShell
      title="Top commanders"
      description="Most popular commanders in Commander, by EDHREC rank and deck count."
      toolbar={
        <>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <TopWindowSelector value={window} onChange={setWindow} />
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

      {loading && items.length === 0 && (
        <p className="mt-4 text-sm text-muted-foreground">Loading...</p>
      )}
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
        onClick={loadMore}
        loading={loadingMore}
        disabled={!nextCursor || loading}
      />
    </PageShell>
  );
}
