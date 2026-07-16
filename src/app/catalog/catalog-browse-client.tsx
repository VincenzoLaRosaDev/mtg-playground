"use client";

import { useState } from "react";

import {
  buildCatalogBrowseSearchParams,
  CatalogBrowseToolbar,
  type CatalogBrowseToolbarState,
} from "@/components/discovery/catalog-browse-toolbar";
import { CardGridTile } from "@/components/discovery/card-grid-tile";
import { LoadMoreButton } from "@/components/discovery/load-more-button";
import { PageListMeta } from "@/components/layout/page-list-meta";
import { PageShell } from "@/components/layout/page-shell";
import { useBrowseList, type BrowseListInitialData } from "@/hooks/use-browse-list";
import type { CatalogBrowseToolbarSnapshot } from "@/lib/browse/catalog-defaults";
import type { CardBrowseItem } from "@/lib/browse/cards-shared";
import { defaultCatalogOrder, defaultCatalogSort, getCatalogBrowseSortOptions } from "@/lib/browse/cards-shared";
import { CARD_FACE_GRID_CLASS } from "@/lib/ui/card-face";

type CatalogBrowseClientProps = {
  initialData: BrowseListInitialData<CardBrowseItem>;
  initialToolbar: CatalogBrowseToolbarSnapshot;
  initialRequestKey: string;
};

export function CatalogBrowseClient({
  initialData,
  initialToolbar,
  initialRequestKey,
}: CatalogBrowseClientProps) {
  const [toolbar, setToolbar] = useState<CatalogBrowseToolbarState>(initialToolbar);

  const { items, total, nextCursor, loading, loadingMore, error, loadMore } =
    useBrowseList<CardBrowseItem>({
      path: "/api/cards/browse",
      requestKey: JSON.stringify(toolbar),
      initialRequestKey,
      initialData,
      searchQuery: toolbar.query,
      errorMessage: "Failed to load catalog",
      buildSearchParams: (cursor) => buildCatalogBrowseSearchParams(toolbar, cursor),
    });

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

      {loading && items.length === 0 && (
        <p className="mt-4 text-sm text-muted-foreground">Loading...</p>
      )}
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
        onClick={loadMore}
        loading={loadingMore}
        disabled={!nextCursor || loading}
      />
    </PageShell>
  );
}
