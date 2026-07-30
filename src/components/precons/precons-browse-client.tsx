"use client";

import { useState } from "react";

import { EmptyState } from "@/components/discovery/empty-state";
import { ListFilterAccess } from "@/components/layout/list-filter-access";
import { ListLoadMoreRow } from "@/components/layout/list-load-more-row";
import { PageListMeta } from "@/components/layout/page-list-meta";
import { PageShell } from "@/components/layout/page-shell";
import { PreconBrowseRow } from "@/components/precons/precon-browse-row";
import {
  buildPreconBrowseSearchParams,
  PreconBrowseToolbar,
  type PreconBrowseToolbarState,
} from "@/components/precons/precon-browse-toolbar";
import { useBrowseList, type BrowseListInitialData } from "@/hooks/use-browse-list";
import type {
  PreconListItem,
  PreconTypeFilterOption,
} from "@/lib/precons/precons";
import { CARD_FACE_GRID_CLASS } from "@/lib/ui/card-face";

type PreconsBrowseClientProps = {
  initialData: BrowseListInitialData<PreconListItem>;
  initialToolbar: PreconBrowseToolbarState;
  initialRequestKey: string;
  typeOptions: PreconTypeFilterOption[];
};

export function PreconsBrowseClient({
  initialData,
  initialToolbar,
  initialRequestKey,
  typeOptions,
}: PreconsBrowseClientProps) {
  const [toolbar, setToolbar] =
    useState<PreconBrowseToolbarState>(initialToolbar);
  const requestKey = JSON.stringify(toolbar);

  const { items, total, nextCursor, loading, loadingMore, error, loadMore } =
    useBrowseList<PreconListItem>({
      path: "/api/precons/search",
      requestKey,
      initialRequestKey,
      initialData,
      searchQuery: toolbar.query,
      errorMessage: "Failed to load precons",
      buildSearchParams: (cursor) =>
        buildPreconBrowseSearchParams(toolbar, cursor),
    });

  const hasActiveFilters = Boolean(
    toolbar.query.trim() ||
      toolbar.format ||
      toolbar.type ||
      toolbar.colors.length ||
      toolbar.sort !== "release" ||
      toolbar.order !== "desc",
  );

  return (
    <PageShell
      title="Precons"
      description="Official constructed precons from MTGJSON — browse, check owned cards, fork into a private deck."
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Precons", href: "/precons" },
      ]}
      toolbar={
        <ListFilterAccess hasActiveFilters={hasActiveFilters} filtersKey={requestKey}>
          <PreconBrowseToolbar
            state={toolbar}
            typeOptions={typeOptions}
            onChange={(patch) =>
              setToolbar((current) => ({ ...current, ...patch }))
            }
          />
        </ListFilterAccess>
      }
    >
      <div className="space-y-4">
        <PageListMeta>
          Official MTGJSON constructed precons.
          {total > 0
            ? ` Showing ${items.length.toLocaleString()} of ${total.toLocaleString()}.`
            : ""}
        </PageListMeta>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        {items.length === 0 && !loading ? (
          <EmptyState
            title="No precons yet"
            description="Run npm run sync:mtgjson-precons after Scryfall printings are indexed, or adjust filters."
          />
        ) : (
          <ul
            className={`mt-6 ${CARD_FACE_GRID_CLASS}`}
            aria-busy={loading || undefined}
          >
            {items.map((item) => (
              <PreconBrowseRow key={item.id} item={item} />
            ))}
          </ul>
        )}

        <ListLoadMoreRow
          loadMore={{
            onClick: () => void loadMore(),
            loading: loadingMore,
            disabled: !nextCursor || loading,
          }}
        />
      </div>
    </PageShell>
  );
}
