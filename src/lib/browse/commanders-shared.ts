import { INCLUSION_RANK_SORT_LABEL } from "@/lib/display/inclusion-rank";

export type CommanderBrowseSort = "popularity" | "name" | "cmc" | "price";

export type CommanderBrowseItem = {
  cardId: string | null;
  slug: string;
  name: string;
  cmc: number | null;
  colorIdentity: string[];
  imageUri: string | null;
  typeLine: string | null;
  /** Scryfall USD prices JSON (for preview footer). */
  prices: unknown;
  popularityRank: number | null;
  frictionScore: number;
};

export function getCommanderBrowseSortOptions(): {
  value: CommanderBrowseSort;
  label: string;
}[] {
  return [
    { value: "name", label: "Name" },
    { value: "cmc", label: "CMC" },
    { value: "price", label: "Price" },
    // Available but not default — inclusion ≠ “as commander” popularity
    { value: "popularity", label: INCLUSION_RANK_SORT_LABEL },
  ];
}

/** Name-first: commanders browse is a catalog filter, not a meta ranking. */
export function defaultSortForCommanderTab(): CommanderBrowseSort {
  return "name";
}

export function defaultOrderForCommanderTab(_sort: CommanderBrowseSort): "asc" | "desc" {
  return "asc";
}
