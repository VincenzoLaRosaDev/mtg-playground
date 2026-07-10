import { encodeBrowseCursor } from "@/lib/browse/cursor";
import type { BrowseListResponse } from "@/lib/browse/types";

export function buildBrowseListResponse<T>(
  rows: T[],
  limit: number,
  total: number,
  getCursorPayload: (item: T) => Record<string, string | number | boolean | null> | null,
): BrowseListResponse<T> {
  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  const lastItem = items.at(-1);
  const nextCursor =
    hasMore && lastItem
      ? encodeBrowseCursor(getCursorPayload(lastItem) ?? {})
      : null;

  return { items, total, nextCursor };
}
