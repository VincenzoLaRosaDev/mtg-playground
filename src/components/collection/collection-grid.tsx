"use client";

import { Trash2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

import { CardFaceTile } from "@/components/discovery/card-face-tile";
import { useCardDetailModal } from "@/components/discovery/card-detail-modal-provider";
import { PriceChip } from "@/components/discovery/price-chip";
import { ListLoadMoreRow } from "@/components/layout/list-load-more-row";
import { PageListMeta } from "@/components/layout/page-list-meta";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import {
  obtainFromWish,
  removeCollectionItem,
  setCollectionQuantity,
} from "@/lib/collection/actions";
import type {
  CollectionListItem,
  CollectionListResult,
} from "@/lib/collection/collection";
import { buildCardVersionHref } from "@/lib/scryfall/card-printing";
import { CARD_FACE_GRID_CLASS } from "@/lib/ui/card-face";
import { QTY_INPUT_WIDTH_CLASS } from "@/lib/ui/qty-input";
import {
  LABEL_INFO_CLASS,
  LABEL_PRIMARY_CLASS,
  STATUS_CHIP_CLASS,
} from "@/lib/ui/selection-chrome";
import { cn } from "@/lib/utils";

type CollectionGridProps = {
  initial: CollectionListResult;
};

export function CollectionGrid({ initial }: CollectionGridProps) {
  const searchParams = useSearchParams();
  const requestKey = searchParams.toString();
  const [items, setItems] = useState(initial.items);
  const [total, setTotal] = useState(initial.total);
  const [nextCursor, setNextCursor] = useState(initial.nextCursor);
  const [loadingMore, setLoadingMore] = useState(false);

  // Re-sync local state when a fresh `initial` arrives (new SSR data after
  // router.refresh(), or a URL/requestKey change) — mirrors the previous
  // [initial, requestKey] effect but adjusts during render, not after.
  const [syncedInitial, setSyncedInitial] = useState(initial);
  const [syncedKey, setSyncedKey] = useState(requestKey);
  if (initial !== syncedInitial || requestKey !== syncedKey) {
    setSyncedInitial(initial);
    setSyncedKey(requestKey);
    setItems(initial.items);
    setTotal(initial.total);
    setNextCursor(initial.nextCursor);
  }

  async function loadMore() {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const params = new URLSearchParams(searchParams.toString());
      params.set("cursor", nextCursor);
      const response = await fetch(`/api/collection?${params.toString()}`);
      if (!response.ok) return;
      const data = (await response.json()) as CollectionListResult;
      setItems((prev) => [...prev, ...data.items]);
      setTotal(data.total);
      setNextCursor(data.nextCursor);
    } finally {
      setLoadingMore(false);
    }
  }

  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No cards in this view yet. Search to add a printing, or import a list.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <PageListMeta>
        Showing {items.length.toLocaleString()} of {total.toLocaleString()}
      </PageListMeta>
      <div className={CARD_FACE_GRID_CLASS}>
        {items.map((item) => (
          <CollectionItemCard key={item.id} item={item} />
        ))}
      </div>
      <ListLoadMoreRow
        loadMore={{ onClick: () => void loadMore(), loading: loadingMore, disabled: !nextCursor }}
      />
    </div>
  );
}

function CollectionItemCard({ item }: { item: CollectionListItem }) {
  const router = useRouter();
  const { openCardDetail } = useCardDetailModal();
  const [pending, startTransition] = useTransition();
  const [qty, setQty] = useState(String(item.quantity));
  const [syncedQuantity, setSyncedQuantity] = useState(item.quantity);
  if (item.quantity !== syncedQuantity) {
    setSyncedQuantity(item.quantity);
    setQty(String(item.quantity));
  }

  const href = item.slug
    ? buildCardVersionHref(item.slug, {
        set: item.setCode,
        cn: item.collectorNumber,
        finish: item.finish,
      })
    : null;

  const isWish = item.wantlist;

  function openModal() {
    if (!item.slug) return;
    openCardDetail({
      mode: "collection",
      slug: item.slug,
      preferredPrintingId: item.printingId,
      initialSet: item.setCode,
      initialCn: item.collectorNumber,
      initialFinish: item.finish,
      imageUri: item.imageUri,
      faces: item.faces,
    });
  }

  return (
    <CardFaceTile
      href={href}
      onOpen={item.slug ? openModal : undefined}
      imageUri={item.imageUri}
      faces={item.faces}
      name={item.name}
      finish={item.finish}
      footer={
        <div className="space-y-2 text-sm">
          <div className="flex min-w-0 flex-wrap items-center justify-between gap-x-2 gap-y-1">
            <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
              <PriceChip
                prices={item.prices}
                preferredFinish={item.finish}
                mode="finish"
                className="min-w-0"
              />
              <span className="min-w-0 truncate text-xs text-muted-foreground">
                {item.setCode.toUpperCase()} #{item.collectorNumber}
              </span>
            </div>
            {isWish ? (
              <span className={cn(STATUS_CHIP_CLASS, "shrink-0", LABEL_INFO_CLASS)}>
                Wish
              </span>
            ) : (
              <span
                className={cn(STATUS_CHIP_CLASS, "shrink-0", LABEL_PRIMARY_CLASS)}
              >
                Owned
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <label className="sr-only" htmlFor={`qty-${item.id}`}>
              {isWish ? "Wish quantity" : "Owned quantity"}
            </label>
            <Input
              id={`qty-${item.id}`}
              type="number"
              min={1}
              className={cn(
                QTY_INPUT_WIDTH_CLASS,
                "h-6 shrink-0 rounded-[min(var(--radius-md),10px)] px-1 text-center text-xs tabular-nums md:text-xs",
              )}
              value={qty}
              disabled={pending}
              onChange={(event) => setQty(event.target.value)}
              onBlur={() => {
                const next = Math.max(0, Math.floor(Number(qty)) || 0);
                setQty(String(next < 1 ? item.quantity : next));
                if (next === item.quantity) return;
                startTransition(async () => {
                  await setCollectionQuantity({ id: item.id, quantity: next });
                  router.refresh();
                });
              }}
            />
            {isWish ? (
              <Button
                type="button"
                size="xs"
                disabled={pending}
                onClick={() => {
                  startTransition(async () => {
                    await obtainFromWish({ id: item.id });
                    router.refresh();
                  });
                }}
              >
                Get
              </Button>
            ) : null}
            <Button
              type="button"
              size="xs"
              variant="ghost"
              className="text-destructive hover:text-destructive"
              disabled={pending}
              onClick={() => {
                startTransition(async () => {
                  await removeCollectionItem({ id: item.id });
                  router.refresh();
                });
              }}
            >
              <Icon icon={Trash2} size="sm" />
              Remove
            </Button>
          </div>
        </div>
      }
    />
  );
}
