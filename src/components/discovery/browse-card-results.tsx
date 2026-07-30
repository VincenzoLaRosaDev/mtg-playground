"use client";

import type { ReactNode } from "react";

import { CARD_FACE_GRID_CLASS } from "@/lib/ui/card-face";

type BrowseCardResultsProps = {
  loading: boolean;
  itemCount: number;
  error: string | null;
  emptyMessage: string;
  children: ReactNode;
};

/**
 * Shared empty / keep-previous pattern for catalog card browse clients.
 * No pending slot or opacity dim — results stay until the new payload swaps in.
 */
export function BrowseCardResults({
  loading,
  itemCount,
  error,
  emptyMessage,
  children,
}: BrowseCardResultsProps) {
  return (
    <>
      {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}

      {itemCount > 0 ? (
        <div className={`mt-6 ${CARD_FACE_GRID_CLASS}`} aria-busy={loading || undefined}>
          {children}
        </div>
      ) : null}

      {!loading && itemCount === 0 && !error ? (
        <p className="mt-6 text-sm text-muted-foreground">{emptyMessage}</p>
      ) : null}
    </>
  );
}
