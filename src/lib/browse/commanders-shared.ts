export type RankedCommanderSort = "rank" | "numDecks" | "salt" | "name";

export type CommanderBrowseSort = RankedCommanderSort;

export type CommanderBrowseItem = {
  cardId: string | null;
  slug: string;
  name: string;
  rank: number | null;
  salt: number | null;
  numDecks: number | null;
  cmc: number | null;
  colorIdentity: string[];
  imageUri: string | null;
  typeLine: string | null;
  hasEdhrecMeta: boolean;
};

export function getCommanderBrowseSortOptions(): { value: CommanderBrowseSort; label: string }[] {
  return [
    { value: "rank", label: "Rank" },
    { value: "numDecks", label: "Decks" },
    { value: "salt", label: "Salt" },
    { value: "name", label: "Name" },
  ];
}

export function defaultSortForCommanderTab(): CommanderBrowseSort {
  return "rank";
}

export function defaultOrderForCommanderTab(
  sort: CommanderBrowseSort,
): "asc" | "desc" {
  if (sort === "name") return "asc";
  if (sort === "rank") return "asc";
  return "desc";
}
