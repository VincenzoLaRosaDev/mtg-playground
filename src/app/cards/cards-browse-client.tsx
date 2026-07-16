"use client";

import { useState } from "react";

import {
  buildCardBrowseSearchParams,
  CardBrowseToolbar,
  type CardBrowseToolbarState,
} from "@/components/discovery/card-browse-toolbar";
import { CardGridTile } from "@/components/discovery/card-grid-tile";
import { LoadMoreButton } from "@/components/discovery/load-more-button";
import { PopularityUnavailableBadge } from "@/components/discovery/popularity-unavailable-badge";
import { TopWindowSelector } from "@/components/discovery/top-window-selector";
import { PageListMeta } from "@/components/layout/page-list-meta";
import { PageShell } from "@/components/layout/page-shell";
import { useBrowseList, type BrowseListInitialData } from "@/hooks/use-browse-list";
import type { CardsBrowseToolbarSnapshot } from "@/lib/browse/cards-defaults";
import type { CardBrowseItem } from "@/lib/browse/cards-shared";
import { defaultOrderForTab, defaultSortForTab, getCardBrowseSortOptions } from "@/lib/browse/cards-shared";
import type { EdhrecCardTopWindowParam } from "@/lib/edhrec/top-window";
import { CARD_FACE_GRID_CLASS } from "@/lib/ui/card-face";

type CardsBrowseClientProps = {
  initialData: BrowseListInitialData<CardBrowseItem>;
  initialWindow: EdhrecCardTopWindowParam;
  initialToolbar: CardsBrowseToolbarSnapshot;
  initialRequestKey: string;
};

export function CardsBrowseClient({
  initialData,
  initialWindow,
  initialToolbar,
  initialRequestKey,
}: CardsBrowseClientProps) {
  const [window, setWindow] = useState<EdhrecCardTopWindowParam>(initialWindow);
  const [toolbar, setToolbar] = useState<CardBrowseToolbarState>(initialToolbar);

  const { items, total, nextCursor, meta, loading, loadingMore, error, loadMore } =
    useBrowseList<CardBrowseItem>({
      path: "/api/cards/browse",
      requestKey: JSON.stringify({ window, toolbar }),
      initialRequestKey,
      initialData,
      searchQuery: toolbar.query,
      errorMessage: "Failed to load cards",
      buildSearchParams: (cursor) => buildCardBrowseSearchParams(toolbar, cursor, window),
    });

  function handleToolbarChange(patch: Partial<CardBrowseToolbarState>) {
    setToolbar((current) => {
      const next = { ...current, ...patch };

      if (patch.sort) {
        const validSorts = getCardBrowseSortOptions().map((option) => option.value);
        if (!validSorts.includes(patch.sort)) {
          next.sort = defaultSortForTab();
          next.order = defaultOrderForTab(next.sort);
        }
      }

      if (patch.sort && !patch.order) {
        next.order = defaultOrderForTab(next.sort);
      }

      return next;
    });
  }

  function handleWindowChange(nextWindow: EdhrecCardTopWindowParam) {
    setWindow(nextWindow);
    const sort = defaultSortForTab();
    setToolbar((current) => ({
      ...current,
      sort,
      order: defaultOrderForTab(sort),
    }));
  }

  const showPopularityUnavailable = meta?.popularityDataAvailable === false;

  return (
    <PageShell
      title="Top cards"
      description="Most played cards in Commander decks, by EDHREC popularity."
      toolbar={
        <>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <TopWindowSelector
              value={window}
              onChange={(nextWindow) => {
                if (nextWindow !== "all") {
                  handleWindowChange(nextWindow);
                }
              }}
              includeAllTime={false}
            />
            {showPopularityUnavailable && <PopularityUnavailableBadge />}
          </div>
          <CardBrowseToolbar state={toolbar} onChange={handleToolbarChange} />
        </>
      }
    >
      <PageListMeta>
        EDHREC top cards for the selected time window.
        {total > 0 ? ` Showing ${items.length.toLocaleString()} of ${total.toLocaleString()}.` : ""}
      </PageListMeta>

      {loading && items.length === 0 && (
        <p className="mt-4 text-sm text-muted-foreground">Loading...</p>
      )}
      {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

      <div className={`mt-6 ${CARD_FACE_GRID_CLASS}`}>
        {items.map((card) => (
          <CardGridTile key={card.id} card={card} />
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
