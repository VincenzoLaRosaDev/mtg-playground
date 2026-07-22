"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { useSession } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addOwnedCopies, addWishCopies } from "@/lib/collection/actions";
import type { OracleCollectionSnapshot } from "@/lib/collection/oracle-collection";
import {
  buildCardVersionHref,
  type PrintingFinish,
} from "@/lib/scryfall/card-printing";
import { cn } from "@/lib/utils";

type CardCollectionPanelProps = {
  slug: string;
  printingId: string | null;
  finish: PrintingFinish;
  /** null when signed out / anonymous — CTAs become Sign in. */
  snapshot: OracleCollectionSnapshot | null;
};

function finishLabel(finish: PrintingFinish): string {
  if (finish === "nonfoil") return "Nonfoil";
  if (finish === "foil") return "Foil";
  return "Etched";
}

export function CardCollectionPanel({
  slug,
  printingId,
  finish,
  snapshot,
}: CardCollectionPanelProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [qty, setQty] = useState("1");
  const [message, setMessage] = useState<string | null>(null);

  if (!printingId) return null;

  const callbackQuery = searchParams.toString();
  const callbackUrl = callbackQuery ? `${pathname}?${callbackQuery}` : pathname;
  const signInHref = `/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`;

  if (status === "loading") {
    return (
      <div className="space-y-2" aria-busy="true">
        <div className="h-4 w-40 animate-pulse rounded bg-muted" />
        <div className="flex gap-2">
          <div className="h-8 w-16 animate-pulse rounded-lg bg-muted" />
          <div className="h-8 w-28 animate-pulse rounded-lg bg-muted" />
          <div className="h-8 w-28 animate-pulse rounded-lg bg-muted" />
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <Button
        render={<Link href={signInHref} />}
        nativeButton={false}
        variant="outline"
        size="sm"
      >
        Sign in to collect
      </Button>
    );
  }

  const activeOwned = snapshot?.activeOwnedQty ?? 0;
  const activeWish = snapshot?.activeWishQty ?? 0;
  const ownedTotal = snapshot?.ownedTotal ?? 0;
  const wishTotal = snapshot?.wishTotal ?? 0;
  const rows = snapshot?.rows ?? [];

  function parseQty(): number {
    return Math.max(1, Math.floor(Number(qty)) || 1);
  }

  function handleAddOwned() {
    if (!printingId) return;
    const delta = parseQty();
    setMessage(null);
    startTransition(async () => {
      const result = await addOwnedCopies({ printingId, finish, delta });
      if (!result.ok) {
        setMessage(result.error);
        return;
      }
      setMessage(`Added ×${delta} owned.`);
      router.refresh();
    });
  }

  function handleAddWish() {
    if (!printingId) return;
    const delta = parseQty();
    setMessage(null);
    startTransition(async () => {
      const result = await addWishCopies({ printingId, finish, delta });
      if (!result.ok) {
        setMessage(result.error);
        return;
      }
      setMessage(`Added ×${delta} to wish.`);
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        {activeOwned > 0 || activeWish > 0 ? (
          <>
            This printing:{" "}
            {activeOwned > 0 ? (
              <span className="font-medium text-primary">Owned ×{activeOwned}</span>
            ) : null}
            {activeOwned > 0 && activeWish > 0 ? " · " : null}
            {activeWish > 0 ? (
              <span className="font-medium text-info-foreground">Wish ×{activeWish}</span>
            ) : null}
          </>
        ) : (
          "This printing is not in your collection."
        )}
        {ownedTotal + wishTotal > 0 ? (
          <span className="text-muted-foreground">
            {" "}
            · Card total: Owned ×{ownedTotal}
            {wishTotal > 0 ? ` · Wish ×${wishTotal}` : ""}
          </span>
        ) : null}
      </p>

      <div className="flex flex-wrap items-end gap-2">
        <div className="w-16">
          <label htmlFor="detail-collection-qty" className="sr-only">
            Quantity
          </label>
          <Input
            id="detail-collection-qty"
            type="number"
            min={1}
            value={qty}
            disabled={pending}
            onChange={(event) => setQty(event.target.value)}
            className="h-8"
          />
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={handleAddOwned}
        >
          Add owned
        </Button>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={pending}
          className="border-info/50 bg-info/15 text-info-foreground hover:bg-info/25"
          onClick={handleAddWish}
        >
          Add to wish
        </Button>
      </div>

      {message ? <p className="text-xs text-muted-foreground">{message}</p> : null}

      {rows.length > 0 ? (
        <div className="space-y-1.5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Your copies
          </p>
          <ul className="space-y-1">
            {rows.map((row) => {
              const href = buildCardVersionHref(slug, {
                set: row.setCode,
                cn: row.collectorNumber,
                finish: row.finish,
              });
              const isActive =
                row.printingId === printingId && row.finish === finish;

              return (
                <li key={row.id}>
                  <Link
                    href={href}
                    className={cn(
                      "flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm transition-colors hover:text-foreground",
                      isActive ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    <span className="font-medium tabular-nums">
                      {row.setCode.toUpperCase()} #{row.collectorNumber}
                    </span>
                    <span>· {finishLabel(row.finish)}</span>
                    <span
                      className={cn(
                        "rounded-md border px-1.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase",
                        row.wantlist
                          ? "border-info/55 bg-info/20 text-info-foreground"
                          : "border-primary/45 bg-primary/15 text-primary",
                      )}
                    >
                      {row.wantlist ? "Wish" : "Owned"} ×{row.quantity}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
          <p className="text-xs text-muted-foreground">
            Manage quantities on{" "}
            <Link href="/collection" className="underline-offset-2 hover:underline">
              Collection
            </Link>
            .
          </p>
        </div>
      ) : null}
    </div>
  );
}
