export type CardBrowseTab = "popular" | "all";

export type PopularCardSort = "inclusion" | "numDecks" | "name" | "salt";
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
  salt: number | null;
  numDecks: number | null;
  inclusion: number | null;
};

export function getCardBrowseSortOptions(
  tab: CardBrowseTab,
): { value: CardBrowseSort; label: string }[] {
  if (tab === "all") {
    return [
      { value: "name", label: "Name" },
      { value: "cmc", label: "CMC" },
    ];
  }

  return [
    { value: "inclusion", label: "Inclusion" },
    { value: "numDecks", label: "Decks" },
    { value: "salt", label: "Salt" },
    { value: "name", label: "Name" },
  ];
}

export function defaultSortForTab(tab: CardBrowseTab): CardBrowseSort {
  return tab === "popular" ? "inclusion" : "name";
}

export function defaultOrderForTab(tab: CardBrowseTab, sort: CardBrowseSort): "asc" | "desc" {
  if (tab === "all" && sort === "name") return "asc";
  if (tab === "all" && sort === "cmc") return "asc";
  if (sort === "name") return "asc";
  return "desc";
}
