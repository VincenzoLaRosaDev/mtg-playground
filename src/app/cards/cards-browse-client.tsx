"use client";

import { useState } from "react";

import { BrowseCardResults } from "@/components/discovery/browse-card-results";
import {
  buildCardBrowseSearchParams,
  CardBrowseToolbar,
  type CardBrowseToolbarState,
} from "@/components/discovery/card-browse-toolbar";
import { CardGridTile } from "@/components/discovery/card-grid-tile";
import { LoadMoreButton } from "@/components/discovery/load-more-button";
import { PageListMeta } from "@/components/layout/page-list-meta";
import { PageShell } from "@/components/layout/page-shell";
import { useBrowseList, type BrowseListInitialData } from "@/hooks/use-browse-list";
import type { CardsBrowseToolbarSnapshot } from "@/lib/browse/cards-defaults";
import type { CardBrowseItem } from "@/lib/browse/cards-shared";
import {
  defaultCatalogOrder,
  defaultCatalogSort,
  getCatalogBrowseSortOptions,
} from "@/lib/browse/cards-shared";

type CardsBrowseClientProps = {
  initialData: BrowseListInitialData<CardBrowseItem>;
  initialToolbar: CardsBrowseToolbarSnapshot;
  initialRequestKey: string;
};

export function CardsBrowseClient({
  initialData,
  initialToolbar,
  initialRequestKey,
}: CardsBrowseClientProps) {
  const [toolbar, setToolbar] = useState<CardBrowseToolbarState>(initialToolbar);

  const { items, total, nextCursor, loading, loadingMore, error, loadMore } =
    useBrowseList<CardBrowseItem>({
      path: "/api/cards/browse",
      requestKey: JSON.stringify(toolbar),
      initialRequestKey,
      initialData,
      searchQuery: toolbar.query,
      errorMessage: "Failed to load cards",
      buildSearchParams: (cursor) => buildCardBrowseSearchParams(toolbar, cursor),
    });

  function handleToolbarChange(patch: Partial<CardBrowseToolbarState>) {
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

  return (
    <PageShell
      title="Cards"
      description="Browse the Commander-legal card catalog from Scryfall."
      toolbar={<CardBrowseToolbar state={toolbar} onChange={handleToolbarChange} />}
    >
      <PageListMeta>
        Scryfall catalog.
        {total > 0 ? ` Showing ${items.length.toLocaleString()} of ${total.toLocaleString()}.` : ""}
      </PageListMeta>

      <BrowseCardResults
        loading={loading}
        itemCount={items.length}
        error={error}
        emptyMessage="No cards match these filters."
      >
        {items.map((card) => (
          <CardGridTile key={card.id} card={card} />
        ))}
      </BrowseCardResults>

      <LoadMoreButton
        onClick={loadMore}
        loading={loadingMore}
        disabled={!nextCursor || loading}
      />
    </PageShell>
  );
}
