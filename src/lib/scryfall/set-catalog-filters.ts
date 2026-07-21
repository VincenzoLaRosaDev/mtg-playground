import type { SetCardFilters } from "@/lib/scryfall/sets";
import { buildCatalogCardWhere, type CardBrowseFilters } from "@/lib/browse/cards";

export function buildSetCatalogCardWhere(filters: SetCardFilters) {
  const catalogFilters: CardBrowseFilters = {
    colors: filters.colors,
    format: filters.format,
    typeContains: filters.typeContains,
    cmcMin: filters.cmcMin,
    cmcMax: filters.cmcMax,
  };

  return buildCatalogCardWhere(catalogFilters);
}
