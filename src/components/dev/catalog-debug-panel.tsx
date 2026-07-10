"use client";

import { useState } from "react";

type CatalogDebugPanelProps = {
  syncStatus: string;
  lastSuccessLabel: string;
};

export function CatalogDebugPanel({ syncStatus, lastSuccessLabel }: CatalogDebugPanelProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <aside
      aria-label="Catalog debug panel"
      className="fixed left-4 top-4 z-50 max-w-sm"
    >
      {expanded ? (
        <div className="rounded-lg border border-violet-300 bg-violet-50/95 p-3 text-xs text-violet-950 shadow-lg backdrop-blur dark:border-violet-800 dark:bg-violet-950/90 dark:text-violet-100">
          <div className="flex items-start justify-between gap-3">
            <p className="font-semibold uppercase tracking-wide">EDHForge catalog · dev</p>
            <button
              type="button"
              onClick={() => setExpanded(false)}
              aria-label="Collapse catalog debug panel"
              className="rounded-md border border-violet-300 px-2 py-1 text-violet-800 hover:bg-violet-100 dark:border-violet-700 dark:text-violet-100 dark:hover:bg-violet-900"
            >
              −
            </button>
          </div>
          <p className="mt-2 text-violet-900/90 dark:text-violet-100/90">
            User-facing UI reads one Postgres catalog. Scryfall supplies card/set identity;
            popularity overlays sync on a schedule.
          </p>
          <dl className="mt-3 space-y-1">
            <div className="flex justify-between gap-3">
              <dt>Popularity sync</dt>
              <dd className="text-right">{syncStatus}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt>Last success</dt>
              <dd className="text-right">{lastSuccessLabel}</dd>
            </div>
          </dl>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          aria-label="Expand catalog debug panel"
          aria-expanded={false}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-violet-300 bg-violet-50/95 text-sm font-semibold text-violet-900 shadow-lg backdrop-blur hover:bg-violet-100 dark:border-violet-800 dark:bg-violet-950/90 dark:text-violet-100 dark:hover:bg-violet-900"
        >
          ⛭
        </button>
      )}
    </aside>
  );
}
