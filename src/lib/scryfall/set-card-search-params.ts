import type { SetCardFilters } from "@/lib/scryfall/sets";
import { parseSetCardFilters } from "@/lib/scryfall/sets";
import {
  defaultSetCardOrder,
  defaultSetCardSort,
} from "@/lib/scryfall/set-card-sort";
import { colorsToParam } from "@/lib/browse/color-identity-filter";
import { raritiesToParam } from "@/lib/browse/rarity-filter";

export function buildSetCardSearchParams(filters: SetCardFilters): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.query) params.set("q", filters.query);
  const rarityParam = raritiesToParam(filters.rarities ?? []);
  if (rarityParam) params.set("rarity", rarityParam);
  const colorParam = colorsToParam(filters.colors ?? []);
  if (colorParam) params.set("color", colorParam);
  if (filters.format) params.set("format", filters.format);
  if (filters.typeContains) params.set("type", filters.typeContains);
  if (filters.cmcMin != null) params.set("cmc_min", String(filters.cmcMin));
  if (filters.cmcMax != null) params.set("cmc_max", String(filters.cmcMax));

  const sort = filters.sort ?? defaultSetCardSort();
  const order = filters.order ?? defaultSetCardOrder(sort);
  if (sort !== defaultSetCardSort()) params.set("sort", sort);
  if (order !== defaultSetCardOrder(sort)) params.set("order", order);

  return params;
}

export function hasActiveSetCardFilters(filters: SetCardFilters): boolean {
  return Boolean(
    filters.query ||
      filters.rarities?.length ||
      filters.colors?.length ||
      filters.format ||
      filters.typeContains ||
      filters.cmcMin != null ||
      filters.cmcMax != null,
  );
}

export function parseSetCardFiltersFromSearchParams(
  searchParams: URLSearchParams,
): SetCardFilters {
  return parseSetCardFilters({
    q: searchParams.get("q") ?? undefined,
    rarity: searchParams.get("rarity") ?? undefined,
    color: searchParams.get("color") ?? undefined,
    format: searchParams.get("format") ?? undefined,
    commander: searchParams.get("commander") ?? undefined,
    type: searchParams.get("type") ?? undefined,
    cmc_min: searchParams.get("cmc_min") ?? undefined,
    cmc_max: searchParams.get("cmc_max") ?? undefined,
    sort: searchParams.get("sort") ?? undefined,
    order: searchParams.get("order") ?? undefined,
  });
}
