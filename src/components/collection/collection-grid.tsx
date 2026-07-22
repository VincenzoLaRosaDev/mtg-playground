"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import { CardFaceTile } from "@/components/discovery/card-face-tile";
import { LoadMoreButton } from "@/components/discovery/load-more-button";
import { PriceChip } from "@/components/discovery/price-chip";
import { PageListMeta } from "@/components/layout/page-list-meta";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  obtainFromWish,
  removeCollectionItem,
  setCollectionQuantity,
  setWishSibling,
} from "@/lib/collection/actions";
import type {
  CollectionListItem,
  CollectionListResult,
} from "@/lib/collection/collection";
import { buildCardVersionHref } from "@/lib/scryfall/card-printing";
import { CARD_FACE_GRID_CLASS } from "@/lib/ui/card-face";
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

  useEffect(() => {
    setItems(initial.items);
    setTotal(initial.total);
    setNextCursor(initial.nextCursor);
  }, [initial, requestKey]);

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
      <LoadMoreButton
        onClick={() => void loadMore()}
        loading={loadingMore}
        disabled={!nextCursor}
      />
    </div>
  );
}

function CollectionItemCard({ item }: { item: CollectionListItem }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [qty, setQty] = useState(String(item.quantity));

  useEffect(() => {
    setQty(String(item.quantity));
  }, [item.quantity]);

  const href = item.slug
    ? buildCardVersionHref(item.slug, {
        set: item.setCode,
        cn: item.collectorNumber,
        finish: item.finish,
      })
    : null;

  const isWish = item.wantlist;

  return (
    <CardFaceTile
      href={href}
      imageUri={item.imageUri}
      faces={item.faces}
      name={item.name}
      finish={item.finish}
      footer={
        <div className="space-y-2 text-sm">
          <div className="flex flex-wrap gap-1">
            {isWish ? (
              <span className="inline-flex h-5 items-center rounded-md border border-info/55 bg-info/20 px-1.5 text-[10px] font-semibold tracking-wide text-info-foreground uppercase">
                Wish
              </span>
            ) : (
              <span className="inline-flex h-5 items-center rounded-md border border-primary/45 bg-primary/15 px-1.5 text-[10px] font-semibold tracking-wide text-primary uppercase">
                Owned
              </span>
            )}
          </div>

          <div className="min-w-0">
            {href ? (
              <Link href={href} className="line-clamp-2 font-medium hover:underline">
                {item.name}
              </Link>
            ) : (
              <p className="line-clamp-2 font-medium">{item.name}</p>
            )}
            <p className="truncate text-xs text-muted-foreground">
              {item.setCode.toUpperCase()} #{item.collectorNumber} · {item.finish}
            </p>
          </div>

          <PriceChip prices={item.prices} preferredFinish={item.finish} />

          <div className="flex flex-wrap items-center gap-1.5">
            <label className="sr-only" htmlFor={`qty-${item.id}`}>
              {isWish ? "Wish quantity" : "Owned quantity"}
            </label>
            <Input
              id={`qty-${item.id}`}
              type="number"
              min={1}
              className="h-7 w-16"
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
                variant="secondary"
                disabled={pending}
                className="border-primary/45 bg-primary/15 text-primary hover:bg-primary/25"
                onClick={() => {
                  startTransition(async () => {
                    await obtainFromWish({ id: item.id });
                    router.refresh();
                  });
                }}
              >
                Get
              </Button>
            ) : (
              <Button
                type="button"
                size="xs"
                variant={item.hasWishSibling ? "secondary" : "outline"}
                disabled={pending}
                className={cn(
                  item.hasWishSibling &&
                    "border-info/50 bg-info/20 text-info-foreground hover:bg-info/30",
                )}
                onClick={() => {
                  startTransition(async () => {
                    await setWishSibling({
                      printingId: item.printingId,
                      finish: item.finish,
                      onWish: !item.hasWishSibling,
                    });
                    router.refresh();
                  });
                }}
              >
                {item.hasWishSibling ? "On wish" : "Add to wish"}
              </Button>
            )}
            <Button
              type="button"
              size="xs"
              variant="ghost"
              disabled={pending}
              onClick={() => {
                startTransition(async () => {
                  await removeCollectionItem({ id: item.id });
                  router.refresh();
                });
              }}
            >
              Remove
            </Button>
          </div>
        </div>
      }
    />
  );
}
