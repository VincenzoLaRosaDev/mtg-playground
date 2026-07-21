"use client";

import { useState } from "react";

import { EmptyState } from "@/components/discovery/empty-state";
import { LoadMoreButton } from "@/components/discovery/load-more-button";
import {
  buildSetBrowseSearchParams,
  SetBrowseToolbar,
  type SetBrowseToolbarState,
} from "@/components/discovery/set-browse-toolbar";
import { SetBrowseRow } from "@/components/discovery/set-browse-row";
import { PageListMeta } from "@/components/layout/page-list-meta";
import { PageShell } from "@/components/layout/page-shell";
import { useBrowseList, type BrowseListInitialData } from "@/hooks/use-browse-list";
import type { SetsBrowseToolbarSnapshot } from "@/lib/browse/sets-defaults";
import type { SetBrowseItem, SetTypeFilterOption } from "@/lib/browse/sets-shared";
import { defaultSetBrowseOrder, getSetBrowseSortOptions } from "@/lib/browse/sets-shared";
import { SET_BROWSE_GRID_CLASS } from "@/lib/ui/card-face";

type SetsBrowseClientProps = {
  initialData: BrowseListInitialData<SetBrowseItem>;
  initialToolbar: SetsBrowseToolbarSnapshot;
  initialRequestKey: string;
  typeOptions: SetTypeFilterOption[];
};

export function SetsBrowseClient({
  initialData,
  initialToolbar,
  initialRequestKey,
  typeOptions,
}: SetsBrowseClientProps) {
  const [toolbar, setToolbar] = useState<SetBrowseToolbarState>(initialToolbar);

  const { items, total, nextCursor, loading, loadingMore, error, loadMore } =
    useBrowseList<SetBrowseItem>({
      path: "/api/sets/search",
      requestKey: JSON.stringify(toolbar),
      initialRequestKey,
      initialData,
      searchQuery: toolbar.query,
      errorMessage: "Failed to load sets",
      buildSearchParams: (cursor) => buildSetBrowseSearchParams(toolbar, cursor),
    });

  function handleToolbarChange(patch: Partial<SetBrowseToolbarState>) {
    setToolbar((current) => {
      const next = { ...current, ...patch };

      if (patch.sort) {
        const validSorts = getSetBrowseSortOptions().map((option) => option.value);
        if (!validSorts.includes(patch.sort)) {
          next.sort = "releasedAt";
          next.order = defaultSetBrowseOrder(next.sort);
        } else if (patch.order == null) {
          next.order = defaultSetBrowseOrder(patch.sort);
        }
      }

      return next;
    });
  }

  return (
    <PageShell
      title="Sets"
      description="Browse Magic sets by release date, type, and indexed card coverage."
      toolbar={
        <SetBrowseToolbar
          state={toolbar}
          onChange={handleToolbarChange}
          typeOptions={typeOptions}
        />
      }
    >
      <PageListMeta>
        Recent sets by default; filter by type, digital/paper, or indexed card lists.
        {total > 0 ? ` Showing ${items.length.toLocaleString()} of ${total.toLocaleString()}.` : ""}
      </PageListMeta>

      {loading && items.length === 0 && (
        <p className="mt-4 text-sm text-muted-foreground">Loading...</p>
      )}
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
        onClick={loadMore}
        loading={loadingMore}
        disabled={!nextCursor || loading}
      />
    </PageShell>
  );
}
