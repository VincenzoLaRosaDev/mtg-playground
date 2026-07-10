import type { BrowseOrder, ParsedBrowseParams } from "@/lib/browse/types";
import { BROWSE_LIMIT_DEFAULT, BROWSE_LIMIT_MAX } from "@/lib/browse/types";

export function parseBrowseLimit(value: string | null | undefined): number {
  const parsed = Number(value ?? BROWSE_LIMIT_DEFAULT);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return BROWSE_LIMIT_DEFAULT;
  }

  return Math.min(Math.floor(parsed), BROWSE_LIMIT_MAX);
}

export function parseBrowseOrder(
  value: string | null | undefined,
  defaultOrder: BrowseOrder = "desc",
): BrowseOrder {
  return value === "asc" || value === "desc" ? value : defaultOrder;
}

export function parseBrowseColorsParam(value: string | null | undefined): string[] | undefined {
  if (!value?.trim()) return undefined;

  const colors = value
    .split(",")
    .map((entry) => entry.trim().toUpperCase())
    .filter(Boolean);

  return colors.length > 0 ? colors : undefined;
}

export function parseBrowseOptionalNumber(value: string | null | undefined): number | undefined {
  if (!value?.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function parseBrowseParams(searchParams: URLSearchParams): ParsedBrowseParams {
  return {
    limit: parseBrowseLimit(searchParams.get("limit")),
    cursor: searchParams.get("cursor"),
    order: parseBrowseOrder(searchParams.get("order")),
  };
}
