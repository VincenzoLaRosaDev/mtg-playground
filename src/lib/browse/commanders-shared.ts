export type CommanderBrowseTab = "ranked" | "all";

export type RankedCommanderSort = "rank" | "numDecks" | "salt" | "name";
export type AllCommanderSort = "numDecks" | "name" | "rank" | "salt";

export type CommanderBrowseSort = RankedCommanderSort | AllCommanderSort;

export type CommanderBrowseItem = {
  cardId: string | null;
  slug: string;
  name: string;
  rank: number | null;
  salt: number | null;
  numDecks: number | null;
  colorIdentity: string[];
  imageUri: string | null;
  typeLine: string | null;
  hasEdhrecMeta: boolean;
};

export function getCommanderBrowseSortOptions(
  tab: CommanderBrowseTab,
): { value: CommanderBrowseSort; label: string }[] {
  if (tab === "all") {
    return [
      { value: "numDecks", label: "Decks" },
      { value: "name", label: "Name" },
      { value: "rank", label: "Rank" },
      { value: "salt", label: "Salt" },
    ];
  }

  return [
    { value: "rank", label: "Rank" },
    { value: "numDecks", label: "Decks" },
    { value: "salt", label: "Salt" },
    { value: "name", label: "Name" },
  ];
}

export function defaultSortForCommanderTab(tab: CommanderBrowseTab): CommanderBrowseSort {
  return tab === "ranked" ? "rank" : "numDecks";
}

export function defaultOrderForCommanderTab(
  tab: CommanderBrowseTab,
  sort: CommanderBrowseSort,
): "asc" | "desc" {
  if (sort === "name") return "asc";
  if (tab === "ranked" && sort === "rank") return "asc";
  return "desc";
}
