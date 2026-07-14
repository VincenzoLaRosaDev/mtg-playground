export type SetCardSort = "collector" | "name" | "rarity" | "cmc";

export type SetCardSortOrder = "asc" | "desc";

const RARITY_RANK: Record<string, number> = {
  common: 0,
  uncommon: 1,
  rare: 2,
  mythic: 3,
  special: 4,
  bonus: 5,
};

export function getSetCardSortOptions(): { value: SetCardSort; label: string }[] {
  return [
    { value: "collector", label: "Collector #" },
    { value: "name", label: "Name" },
    { value: "rarity", label: "Rarity" },
    { value: "cmc", label: "CMC" },
  ];
}

export function defaultSetCardSort(): SetCardSort {
  return "collector";
}

export function defaultSetCardOrder(_sort: SetCardSort): SetCardSortOrder {
  return "asc";
}

export function parseSetCardSort(value: string | null | undefined): SetCardSort {
  const options = getSetCardSortOptions();
  if (value && options.some((option) => option.value === value)) {
    return value as SetCardSort;
  }
  return defaultSetCardSort();
}

export function parseSetCardSortOrder(value: string | null | undefined): SetCardSortOrder {
  return value === "desc" ? "desc" : "asc";
}

type SortableSetCard = {
  name: string;
  collectorNumber: string;
  rarity: string;
  oracleId: string;
};

type CatalogSortFields = {
  cmc: number;
};

export function sortSetCards<T extends SortableSetCard>(
  cards: T[],
  catalogByOracle: Map<string, CatalogSortFields>,
  sort: SetCardSort,
  order: SetCardSortOrder,
): T[] {
  const sorted = [...cards];

  sorted.sort((a, b) => {
    let cmp = 0;

    switch (sort) {
      case "name":
        cmp = a.name.localeCompare(b.name);
        break;
      case "rarity":
        cmp = (RARITY_RANK[a.rarity] ?? 99) - (RARITY_RANK[b.rarity] ?? 99);
        break;
      case "cmc": {
        const cmcA = catalogByOracle.get(a.oracleId)?.cmc ?? -1;
        const cmcB = catalogByOracle.get(b.oracleId)?.cmc ?? -1;
        cmp = cmcA - cmcB;
        break;
      }
      case "collector":
      default:
        cmp = a.collectorNumber.localeCompare(b.collectorNumber, undefined, { numeric: true });
        break;
    }

    if (cmp === 0) {
      cmp = a.collectorNumber.localeCompare(b.collectorNumber, undefined, { numeric: true });
    }

    return order === "desc" ? -cmp : cmp;
  });

  return sorted;
}
