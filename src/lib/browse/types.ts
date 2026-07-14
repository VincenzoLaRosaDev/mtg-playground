export type BrowseOrder = "asc" | "desc";

export type BrowseListMeta = {
  popularityDataAvailable: boolean;
  window?: string;
};

export type BrowseListResponse<T> = {
  items: T[];
  total: number;
  nextCursor: string | null;
  meta?: BrowseListMeta;
};

export const BROWSE_LIMIT_DEFAULT = 50;
export const BROWSE_LIMIT_MAX = 100;

export type ParsedBrowseParams = {
  limit: number;
  cursor: string | null;
  order: BrowseOrder;
};
