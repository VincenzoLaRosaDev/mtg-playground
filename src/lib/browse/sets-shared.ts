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

export type SetTypeFilterOption = { value: string; label: string };

/** Title-case Scryfall set_type for select labels (`draft_innovation` → `Draft Innovation`). */
export function labelSetType(setType: string): string {
  return setType
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

/** Build set-type select options from distinct DB values (plus “Any type”). */
export function buildSetTypeFilterOptions(setTypes: string[]): SetTypeFilterOption[] {
  return [
    { value: "", label: "Any type" },
    ...setTypes.map((setType) => ({
      value: setType,
      label: labelSetType(setType),
    })),
  ];
}

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
