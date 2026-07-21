import { colorsToParam } from "@/lib/browse/color-identity-filter";
import { raritiesToParam } from "@/lib/browse/rarity-filter";
import type { ScryfallBrowseFormat } from "@/lib/formats/scryfall-formats";

export type CatalogFilterParams = {
  colors: string[];
  rarities: string[];
  typeContains: string;
  cmcMin: string;
  cmcMax: string;
  format?: ScryfallBrowseFormat | "";
  commandersOnly?: boolean;
};

export function appendCatalogFilterParams(
  params: URLSearchParams,
  filters: CatalogFilterParams,
): void {
  const colorParam = colorsToParam(filters.colors);
  const rarityParam = raritiesToParam(filters.rarities);

  if (colorParam) params.set("color", colorParam);
  if (rarityParam) params.set("rarity", rarityParam);
  if (filters.typeContains.trim()) params.set("type", filters.typeContains.trim());
  if (filters.cmcMin) params.set("cmc_min", filters.cmcMin);
  if (filters.cmcMax) params.set("cmc_max", filters.cmcMax);
  if (filters.format) params.set("format", filters.format);
  if (filters.commandersOnly) params.set("commanders_only", "true");
}
