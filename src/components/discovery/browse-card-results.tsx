"use client";

import type { ReactNode } from "react";

import { CardGridSkeleton } from "@/components/discovery/loading-skeletons";
import { CARD_FACE_GRID_CLASS } from "@/lib/ui/card-face";
import { cn } from "@/lib/utils";

type BrowseCardResultsProps = {
  loading: boolean;
  itemCount: number;
  error: string | null;
  emptyMessage: string;
  children: ReactNode;
  skeletonCount?: number;
};

/** Shared empty / skeleton / opacity pattern for catalog card browse clients. */
export function BrowseCardResults({
  loading,
  itemCount,
  error,
  emptyMessage,
  children,
  skeletonCount = 10,
}: BrowseCardResultsProps) {
  return (
    <>
      {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}

      {loading && itemCount === 0 ? (
        <div className="mt-6">
          <CardGridSkeleton count={skeletonCount} />
        </div>
      ) : (
        <div
          className={cn(`mt-6 ${CARD_FACE_GRID_CLASS}`, loading && "opacity-60")}
          aria-busy={loading || undefined}
        >
          {children}
        </div>
      )}

      {!loading && itemCount === 0 && !error ? (
        <p className="mt-6 text-sm text-muted-foreground">{emptyMessage}</p>
      ) : null}
    </>
  );
}
