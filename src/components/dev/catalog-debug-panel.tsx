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
      className="fixed right-4 bottom-4 z-50 max-w-sm"
    >
      {expanded ? (
        <div className="rounded-lg border border-info/40 bg-card/95 p-3 text-xs text-card-foreground shadow-lg backdrop-blur">
          <div className="flex items-start justify-between gap-3">
            <p className="font-semibold uppercase tracking-wide text-info-foreground">
              MTGPlayground catalog · dev
            </p>
            <button
              type="button"
              onClick={() => {
                setExpanded(false);
                setHealth(null);
                setError(null);
                setLoading(false);
              }}
              aria-label="Collapse catalog debug panel"
              className="cursor-pointer rounded-md border border-border px-2 py-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              −
            </button>
          </div>
          <p className="mt-2 text-muted-foreground">
            User-facing UI reads one Postgres catalog. Scryfall supplies card/set identity.
          </p>
          {loading && <p className="mt-3 text-muted-foreground">Loading sync status…</p>}
          {error && <p className="mt-3 text-destructive">{error}</p>}
          {health && !loading && (
            <dl className="mt-3 space-y-1">
              <div className="flex justify-between gap-3">
                <dt>Scryfall sync</dt>
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
          className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-info/40 bg-card/95 text-sm font-semibold text-info-foreground shadow-lg backdrop-blur hover:bg-muted"
        >
          ⛭
        </button>
      )}
    </aside>
  );
}
