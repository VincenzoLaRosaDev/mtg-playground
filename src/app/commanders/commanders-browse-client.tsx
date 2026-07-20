"use client";

import { useState } from "react";

import {
  buildCommanderBrowseSearchParams,
  CommanderBrowseToolbar,
  type CommanderBrowseToolbarState,
} from "@/components/discovery/commander-browse-toolbar";
import { CommanderGridTile } from "@/components/discovery/commander-grid-tile";
import { LoadMoreButton } from "@/components/discovery/load-more-button";
import { PageListMeta } from "@/components/layout/page-list-meta";
import { PageShell } from "@/components/layout/page-shell";
import { useBrowseList, type BrowseListInitialData } from "@/hooks/use-browse-list";
import type { CommandersBrowseToolbarSnapshot } from "@/lib/browse/commanders-defaults";
import type { CommanderBrowseItem } from "@/lib/browse/commanders-shared";
import {
  defaultOrderForCommanderTab,
  defaultSortForCommanderTab,
  getCommanderBrowseSortOptions,
} from "@/lib/browse/commanders-shared";
import { CARD_FACE_GRID_CLASS } from "@/lib/ui/card-face";

type CommandersBrowseClientProps = {
  initialData: BrowseListInitialData<CommanderBrowseItem>;
  initialToolbar: CommandersBrowseToolbarSnapshot;
  initialRequestKey: string;
};

export function CommandersBrowseClient({
  initialData,
  initialToolbar,
  initialRequestKey,
}: CommandersBrowseClientProps) {
  const [toolbar, setToolbar] = useState<CommanderBrowseToolbarState>(initialToolbar);

  const { items, total, nextCursor, loading, loadingMore, error, loadMore } =
    useBrowseList<CommanderBrowseItem>({
      path: "/api/commanders/browse",
      requestKey: JSON.stringify(toolbar),
      initialRequestKey,
      initialData,
      searchQuery: toolbar.query,
      errorMessage: "Failed to load commanders",
      buildSearchParams: (cursor) => buildCommanderBrowseSearchParams(toolbar, cursor),
    });

  function handleToolbarChange(patch: Partial<CommanderBrowseToolbarState>) {
    setToolbar((current) => {
      const next = { ...current, ...patch };

      if (patch.sort) {
        const validSorts = getCommanderBrowseSortOptions().map((option) => option.value);
        if (!validSorts.includes(patch.sort)) {
          next.sort = defaultSortForCommanderTab();
          next.order = defaultOrderForCommanderTab(next.sort);
        }
      }

      if (patch.sort && !patch.order) {
        next.order = defaultOrderForCommanderTab(next.sort);
      }

      return next;
    });
  }

  return (
    <PageShell
      title="Commanders"
      description="Browse every commander-legal legendary from the Scryfall catalog."
      toolbar={<CommanderBrowseToolbar state={toolbar} onChange={handleToolbarChange} />}
    >
      <PageListMeta>
        Scryfall catalog — commanders only.
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
