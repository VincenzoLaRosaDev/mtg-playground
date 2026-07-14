import type { SetCardFilters } from "@/lib/scryfall/sets";
import { buildCatalogCardWhere, type CardBrowseFilters } from "@/lib/browse/cards";

export function buildSetCatalogCardWhere(filters: SetCardFilters) {
  const catalogFilters: CardBrowseFilters = {
    colors: filters.colors,
    commanderLegal: filters.commanderLegal,
    typeContains: filters.typeContains,
    cmcMin: filters.cmcMin,
    cmcMax: filters.cmcMax,
  };

  return buildCatalogCardWhere(catalogFilters);
}
