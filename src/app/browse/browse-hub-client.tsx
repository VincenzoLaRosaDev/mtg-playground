"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

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
  defaultCatalogSort,
  getCatalogBrowseSortOptions,
} from "@/lib/browse/cards-shared";
import type { BrowseEntity } from "@/lib/browse/cards-params";
import { CARD_FACE_GRID_CLASS } from "@/lib/ui/card-face";

type BrowseHubClientProps = {
  initialData: BrowseListInitialData<CardBrowseItem>;
  initialToolbar: BrowseHubToolbarSnapshot;
  initialRequestKey: string;
};

export function BrowseHubClient({
  initialData,
  initialToolbar,
  initialRequestKey,
}: BrowseHubClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
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

  useEffect(() => {
    const entity = toolbar.entity;
    const current = searchParams.get("entity") ?? "cards";
    if (current === entity) return;
    const next = new URLSearchParams(searchParams.toString());
    next.set("entity", entity);
    router.replace(`${pathname}?${next.toString()}`);
  }, [toolbar.entity, pathname, router, searchParams]);

  function handleToolbarChange(patch: Partial<BrowseHubToolbarState>) {
    setToolbar((current) => {
      const next = { ...current, ...patch };

      if (patch.entity && patch.entity !== current.entity) {
        // Reset rarity / commander-legal when switching entity.
        if (patch.entity === "commanders") {
          next.rarities = [];
          next.commanderLegal = false;
          // Catalog filter of legal commanders — not an inclusion “top commanders” list
          next.sort = "name";
          next.order = defaultCatalogOrder("name");
        } else if (patch.entity === "cards") {
          next.sort = defaultCatalogSort();
          next.order = defaultCatalogOrder(next.sort);
        }
      }

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

  const title = toolbar.entity === "commanders" ? "Commanders" : "Cards";
  const description =
    toolbar.entity === "commanders"
      ? "Legendary cards that can be your commander — catalog filter, not a popularity ranking."
      : "Browse the Scryfall card catalog. Inclusion rank reflects Commander deck inclusion.";

  return (
    <PageShell
      title="Browse"
      description={description}
      toolbar={<BrowseHubToolbar state={toolbar} onChange={handleToolbarChange} />}
    >
      <PageListMeta>
        {title}
        {toolbar.entity === "commanders"
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

export type { BrowseEntity };
