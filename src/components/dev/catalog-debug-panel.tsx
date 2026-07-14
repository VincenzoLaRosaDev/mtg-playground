"use client";

import { useEffect, useState } from "react";

import { isCatalogDebugEnabled } from "@/lib/dev/catalog-debug";

type CatalogHealth = {
  syncStatus: string;
  lastSuccessAt: string | null;
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function CatalogDebugPanel() {
  const [expanded, setExpanded] = useState(false);
  const [health, setHealth] = useState<CatalogHealth | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!expanded || health) {
      return;
    }

    const controller = new AbortController();
    let cancelled = false;

    async function loadHealth() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/dev/catalog-health", {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Failed to load catalog health");
        }

        const data = (await response.json()) as CatalogHealth;
        if (!cancelled) {
          setHealth(data);
        }
      } catch (err) {
        if (!cancelled && err instanceof Error && err.name !== "AbortError") {
          setError(err.message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadHealth();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [expanded, health]);

  if (!isCatalogDebugEnabled()) {
    return null;
  }

  const lastSuccessLabel =
    health?.lastSuccessAt != null ? formatDate(health.lastSuccessAt) : health ? "Never" : "—";

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
              onClick={() => {
                setExpanded(false);
                setHealth(null);
                setError(null);
                setLoading(false);
              }}
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
          {loading && <p className="mt-3 text-violet-800 dark:text-violet-200">Loading sync status…</p>}
          {error && <p className="mt-3 text-red-700 dark:text-red-300">{error}</p>}
          {health && !loading && (
            <dl className="mt-3 space-y-1">
              <div className="flex justify-between gap-3">
                <dt>Popularity sync</dt>
                <dd className="text-right">{health.syncStatus}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>Last success</dt>
                <dd className="text-right">{lastSuccessLabel}</dd>
              </div>
            </dl>
          )}
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
