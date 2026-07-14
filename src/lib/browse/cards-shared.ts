
export type CardBrowseTab = "popular" | "all";

export type PopularCardSort = "rank" | "inclusion" | "numDecks" | "name" | "salt";
export type AllCardSort = "name" | "cmc";

export type CardBrowseSort = PopularCardSort | AllCardSort;

export type CardBrowseItem = {
  id: string;
  name: string;
  edhrecSlug: string | null;
  typeLine: string;
  cmc: number;
  colorIdentity: string[];
  imageUri: string | null;
  isCommander: boolean;
  hasEdhrecData: boolean;
  rank: number | null;
  salt: number | null;
  numDecks: number | null;
  inclusion: number | null;
  potentialDecks: number | null;
};

export function getCatalogBrowseSortOptions(): { value: AllCardSort; label: string }[] {
  return [
    { value: "name", label: "Name" },
    { value: "cmc", label: "CMC" },
  ];
}

export function defaultCatalogSort(): AllCardSort {
  return "name";
}

export function defaultCatalogOrder(sort: AllCardSort): "asc" | "desc" {
  return sort === "name" || sort === "cmc" ? "asc" : "desc";
}

export function getCardBrowseSortOptions(): { value: CardBrowseSort; label: string }[] {
  return [
    { value: "rank", label: "Rank" },
    { value: "inclusion", label: "Inclusion" },
    { value: "numDecks", label: "Decks" },
    { value: "salt", label: "Salt" },
    { value: "name", label: "Name" },
  ];
}

export function defaultSortForTab(): CardBrowseSort {
  return "rank";
}

export function defaultOrderForTab(sort: CardBrowseSort): "asc" | "desc" {
  if (sort === "inclusion" || sort === "rank" || sort === "name") return "asc";
  return "desc";
}
