export type BrowseOrder = "asc" | "desc";

export type BrowseListResponse<T> = {
  items: T[];
  total: number;
  nextCursor: string | null;
};

export const BROWSE_LIMIT_DEFAULT = 50;
export const BROWSE_LIMIT_MAX = 100;

export type ParsedBrowseParams = {
  limit: number;
  cursor: string | null;
  order: BrowseOrder;
};
