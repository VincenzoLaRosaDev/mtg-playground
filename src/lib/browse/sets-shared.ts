export type SetBrowseSort = "releasedAt" | "name" | "cardCount" | "indexed";

export type SetBrowseItem = {
  code: string;
  name: string;
  releasedAt: string | null;
  setType: string;
  cardCount: number;
  iconUri: string | null;
  digital: boolean;
  indexedCardCount: number;
};

/** Common Scryfall set types for browse filtering (sync skips token/memorabilia). */
export const SET_BROWSE_TYPE_OPTIONS = [
  { value: "", label: "Any type" },
  { value: "expansion", label: "Expansion" },
  { value: "core", label: "Core" },
  { value: "masters", label: "Masters" },
  { value: "commander", label: "Commander" },
  { value: "draft_innovation", label: "Draft innovation" },
  { value: "starter", label: "Starter" },
  { value: "promo", label: "Promo" },
  { value: "eternal", label: "Eternal" },
  { value: "alchemy", label: "Alchemy" },
] as const;

export function getSetBrowseSortOptions(): { value: SetBrowseSort; label: string }[] {
  return [
    { value: "releasedAt", label: "Release date" },
    { value: "name", label: "Name" },
    { value: "cardCount", label: "Card count" },
    { value: "indexed", label: "Indexed cards" },
  ];
}

export function defaultSetBrowseSort(): SetBrowseSort {
  return "releasedAt";
}

export function defaultSetBrowseOrder(sort: SetBrowseSort): "asc" | "desc" {
  if (sort === "name") return "asc";
  return "desc";
}
