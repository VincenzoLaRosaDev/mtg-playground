"use client";

import { useEffect, useRef, useState } from "react";

import type { BrowseListMeta, BrowseListResponse } from "@/lib/browse/types";

export type BrowseListInitialData<TItem> = BrowseListResponse<TItem>;

type UseBrowseListOptions<TItem> = {
  path: string;
  /** Changes when filters / window change — triggers a fresh fetch. */
  requestKey: string;
  buildSearchParams: (cursor?: string | null) => URLSearchParams;
  /** Used for query debounce (≥2 chars → 250ms). */
  searchQuery: string;
  errorMessage?: string;
  /**
   * SSR first page. Skips the initial client fetch while `requestKey`
   * still matches `initialRequestKey`.
   */
  initialData?: BrowseListInitialData<TItem>;
  initialRequestKey?: string;
};

export type UseBrowseListResult<TItem> = {
  items: TItem[];
  total: number;
  nextCursor: string | null;
  meta: BrowseListMeta | null;
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  loadMore: () => void;
};

/**
 * Shared cursor pagination + debounce for discovery browse pages.
 */
export function useBrowseList<TItem>(
  options: UseBrowseListOptions<TItem>,
): UseBrowseListResult<TItem> {
  const {
    path,
    requestKey,
    buildSearchParams,
    searchQuery,
    errorMessage = "Failed to load",
    initialData,
    initialRequestKey,
  } = options;

  const buildSearchParamsRef = useRef(buildSearchParams);
  buildSearchParamsRef.current = buildSearchParams;

  const hasInitialData = initialData != null;

  const [items, setItems] = useState<TItem[]>(() => initialData?.items ?? []);
  const [total, setTotal] = useState(() => initialData?.total ?? 0);
  const [nextCursor, setNextCursor] = useState<string | null>(
    () => initialData?.nextCursor ?? null,
  );
  const [meta, setMeta] = useState<BrowseListMeta | null>(
    () => initialData?.meta ?? null,
  );
  const [loading, setLoading] = useState(!hasInitialData);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nextCursorRef = useRef<string | null>(null);
  nextCursorRef.current = nextCursor;
  const loadingMoreRef = useRef(false);
  loadingMoreRef.current = loadingMore;

  /** One-shot: skip the first effect when SSR data covers the current requestKey. */
  const skipInitialFetchRef = useRef(
    hasInitialData && initialRequestKey != null && requestKey === initialRequestKey,
  );
  const initialRequestKeyRef = useRef(initialRequestKey);

  useEffect(() => {
    if (
      skipInitialFetchRef.current &&
      initialRequestKeyRef.current != null &&
      requestKey === initialRequestKeyRef.current
    ) {
      skipInitialFetchRef.current = false;
      return;
    }

    skipInitialFetchRef.current = false;

    const controller = new AbortController();
    const delay = searchQuery.trim().length >= 2 ? 250 : 0;

    setLoading(true);
    setError(null);

    const timeout = setTimeout(() => {
      void (async () => {
        try {
          const params = buildSearchParamsRef.current(null);
          const response = await fetch(`${path}?${params.toString()}`, {
            signal: controller.signal,
          });

          if (!response.ok) {
            throw new Error(errorMessage);
          }

          const data = (await response.json()) as BrowseListResponse<TItem>;

          setTotal(data.total);
          setNextCursor(data.nextCursor);
          setMeta(data.meta ?? null);
          setItems(data.items);
        } catch (err) {
          if (err instanceof Error && err.name !== "AbortError") {
            setError(err.message);
          }
        } finally {
          if (!controller.signal.aborted) {
            setLoading(false);
            setLoadingMore(false);
          }
        }
      })();
    }, delay);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [path, errorMessage, searchQuery, requestKey]);

  function loadMore() {
    const cursor = nextCursorRef.current;
    if (!cursor || loadingMoreRef.current) return;

    setLoadingMore(true);
    setError(null);

    void (async () => {
      try {
        const params = buildSearchParamsRef.current(cursor);
        const response = await fetch(`${path}?${params.toString()}`);

        if (!response.ok) {
          throw new Error(errorMessage);
        }

        const data = (await response.json()) as BrowseListResponse<TItem>;

        setTotal(data.total);
        setNextCursor(data.nextCursor);
        setMeta(data.meta ?? null);
        setItems((current) => [...current, ...data.items]);
      } catch (err) {
        if (err instanceof Error && err.name !== "AbortError") {
          setError(err.message);
        }
      } finally {
        setLoadingMore(false);
      }
    })();
  }

  return {
    items,
    total,
    nextCursor,
    meta,
    loading,
    loadingMore,
    error,
    loadMore,
  };
}
