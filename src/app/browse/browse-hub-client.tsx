"use client";

import { useState } from "react";

import {
  BrowseHubToolbar,
  buildBrowseHubSearchParams,
  type BrowseHubToolbarState,
} from "@/components/discovery/browse-hub-toolbar";
import { CardGridTile } from "@/components/discovery/card-grid-tile";
import { LoadMoreButton } from "@/components/discovery/load-more-button";
import { PageListMeta } from "@/components/layout/page-list-meta";
import { PageShell } from "@/components/layout/page-shell";
import { useBrowseList, type BrowseListInitialData } from "@/hooks/use-browse-list";
import type { BrowseHubToolbarSnapshot } from "@/lib/browse/browse-defaults";
import type { CardBrowseItem } from "@/lib/browse/cards-shared";
import {
  defaultCatalogOrder,
  defaultCatalogSortForFormat,
  getCatalogBrowseSortOptions,
} from "@/lib/browse/cards-shared";
import { CARD_FACE_GRID_CLASS } from "@/lib/ui/card-face";

type BrowseHubClientProps = {
  initialData: BrowseListInitialData<CardBrowseItem>;
  initialToolbar: BrowseHubToolbarSnapshot;
  initialRequestKey: string;
  presentRoles: string[];
  presentThemes: string[];
};

/** Show Inclusion on tiles for Any/Commander format, or when sorting by Inclusion. */
export function shouldShowBrowseInclusionRank(state: {
  format: string;
  sort: string;
}): boolean {
  if (state.sort === "popularity") return true;
  return !state.format || state.format === "commander";
}

export function BrowseHubClient({
  initialData,
  initialToolbar,
  initialRequestKey,
  presentRoles,
  presentThemes,
}: BrowseHubClientProps) {
  const [toolbar, setToolbar] = useState<BrowseHubToolbarState>(initialToolbar);

  const { items, total, nextCursor, loading, loadingMore, error, loadMore } =
    useBrowseList<CardBrowseItem>({
      path: "/api/browse",
      requestKey: JSON.stringify(toolbar),
      initialRequestKey,
      initialData,
      searchQuery: toolbar.query,
      errorMessage: "Failed to load catalog",
      buildSearchParams: (cursor) => buildBrowseHubSearchParams(toolbar, cursor),
    });

  function handleToolbarChange(patch: Partial<BrowseHubToolbarState>) {
    setToolbar((current) => {
      const next = { ...current, ...patch };

      if (patch.commandersOnly != null && patch.commandersOnly !== current.commandersOnly) {
        if (patch.commandersOnly) {
          next.sort = "name";
          next.order = defaultCatalogOrder("name");
        } else {
          next.sort = defaultCatalogSortForFormat(next.format);
          next.order = defaultCatalogOrder(next.sort);
        }
      }

      if (patch.format !== undefined && patch.format !== current.format) {
        if (!next.commandersOnly) {
          next.sort = defaultCatalogSortForFormat(next.format);
          next.order = defaultCatalogOrder(next.sort);
        }
      }

      if (patch.sort) {
        const validSorts = getCatalogBrowseSortOptions().map((option) => option.value);
        if (!validSorts.includes(patch.sort)) {
          next.sort = defaultCatalogSortForFormat(next.format);
          next.order = defaultCatalogOrder(next.sort);
        }
      }

      if (patch.sort && !patch.order) {
        next.order = defaultCatalogOrder(next.sort);
      }

      return next;
    });
  }

  const showInclusion = shouldShowBrowseInclusionRank(toolbar);

  const description = toolbar.commandersOnly
    ? "Legendary cards that can be your commander — catalog filter, not a popularity ranking."
    : "Browse the Scryfall card catalog. Inclusion is Commander (EDH) deck inclusion from Scryfall.";

  return (
    <PageShell
      title="Browse"
      description={description}
      toolbar={
        <BrowseHubToolbar
          state={toolbar}
          onChange={handleToolbarChange}
          presentRoles={presentRoles}
          presentThemes={presentThemes}
        />
      }
    >
      <PageListMeta>
        {toolbar.commandersOnly ? "Commanders" : "Cards"}
        {toolbar.commandersOnly
          ? " · legal commanders from Scryfall."
          : " · Scryfall catalog."}
        {total > 0
          ? ` Showing ${items.length.toLocaleString()} of ${total.toLocaleString()}.`
          : ""}
      </PageListMeta>

      {loading && items.length === 0 && (
        <p className="mt-4 text-sm text-muted-foreground">Loading...</p>
      )}
      {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

      <div className={`mt-6 ${CARD_FACE_GRID_CLASS}`}>
        {items.map((card) => (
          <CardGridTile
            key={card.id}
            card={card}
            showInclusionRank={showInclusion}
          />
        ))}
      </div>

      {!loading && items.length === 0 && !error && (
        <p className="mt-6 text-sm text-muted-foreground">No results match these filters.</p>
      )}

      <LoadMoreButton
        onClick={loadMore}
        loading={loadingMore}
        disabled={!nextCursor || loading}
      />
    </PageShell>
  );
}
