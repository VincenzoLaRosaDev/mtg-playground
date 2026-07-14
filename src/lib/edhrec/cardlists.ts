import type { EdhrecCardList, EdhrecCardView } from "@/lib/edhrec/types";
import { formatInclusionPercent as formatInclusionPercentFromDisplay } from "@/lib/display/formatters";

export type CardlistsInput =
  | Record<string, EdhrecCardList>
  | EdhrecCardList[]
  | null
  | undefined;

export type ParsedCardListSection = {
  id: string;
  tag: string;
  header: string;
  cards: EdhrecCardView[];
  showSynergy: boolean;
  linkTo: "card" | "commander";
};

type CardListSectionConfig = {
  tag: string;
  showSynergy?: boolean;
  priority: number;
};

/** Known EDHREC commander detail `cardlists` tags (order matters). */
export const COMMANDER_CARDLIST_SECTIONS: CardListSectionConfig[] = [
  { tag: "newcards", priority: 10 },
  { tag: "highsynergycards", showSynergy: true, priority: 20 },
  { tag: "topcards", priority: 30 },
  { tag: "gamechangers", priority: 40 },
  { tag: "creatures", priority: 100 },
  { tag: "instants", priority: 110 },
  { tag: "sorceries", priority: 120 },
  { tag: "utilityartifacts", priority: 130 },
  { tag: "enchantments", priority: 140 },
  { tag: "planeswalkers", priority: 150 },
  { tag: "battles", priority: 155 },
  { tag: "utilitylands", priority: 160 },
  { tag: "manaartifacts", priority: 170 },
  { tag: "lands", priority: 180 },
  { tag: "basics", priority: 190 },
  { tag: "artifacts", priority: 195 },
  { tag: "averagedeck", priority: 200 },
];

const COMMANDER_SECTION_PRIORITY = new Map(
  COMMANDER_CARDLIST_SECTIONS.map((section) => [section.tag, section]),
);

/** Card detail page: co-played / deck-context lists (excludes top commanders block). */
export const CARD_DETAIL_CARDLIST_SECTIONS: CardListSectionConfig[] = [
  { tag: "newcommanders", priority: 5 },
  { tag: "newcards", priority: 10 },
  { tag: "highliftcards", priority: 20 },
  { tag: "topcards", priority: 30 },
  { tag: "gamechangers", priority: 40 },
  { tag: "creatures", priority: 100 },
  { tag: "instants", priority: 110 },
  { tag: "sorceries", priority: 120 },
  { tag: "utilityartifacts", priority: 130 },
  { tag: "enchantments", priority: 140 },
  { tag: "planeswalkers", priority: 150 },
  { tag: "battles", priority: 155 },
  { tag: "utilitylands", priority: 160 },
  { tag: "manaartifacts", priority: 170 },
  { tag: "lands", priority: 180 },
  { tag: "basics", priority: 190 },
  { tag: "artifacts", priority: 195 },
];

const CARD_DETAIL_SECTION_PRIORITY = new Map(
  CARD_DETAIL_CARDLIST_SECTIONS.map((section) => [section.tag, section]),
);

const COMMANDER_NAV_CARDLIST_TAGS = new Set(
  COMMANDER_CARDLIST_SECTIONS.map((section) => section.tag).filter(
    (tag) => tag !== "averagedeck",
  ),
);

const CARD_NAV_CARDLIST_TAGS = new Set(
  CARD_DETAIL_CARDLIST_SECTIONS.map((section) => section.tag),
);

/** Cardlist tags rendered on both commander and card detail pages (same EDHREC bucket). */
export function isSharedDetailCardlistTag(tag: string): boolean {
  return COMMANDER_NAV_CARDLIST_TAGS.has(tag) && CARD_NAV_CARDLIST_TAGS.has(tag);
}

export function isCardDetailUniqueCardlistTag(tag: string): boolean {
  return CARD_NAV_CARDLIST_TAGS.has(tag) && !COMMANDER_NAV_CARDLIST_TAGS.has(tag);
}

export function isCommanderDetailUniqueCardlistTag(tag: string): boolean {
  return COMMANDER_NAV_CARDLIST_TAGS.has(tag) && !CARD_NAV_CARDLIST_TAGS.has(tag);
}

export function partitionDetailCardlistSections(
  sections: ParsedCardListSection[],
  view: "card" | "commander",
): { unique: ParsedCardListSection[]; shared: ParsedCardListSection[] } {
  const isUnique =
    view === "card" ? isCardDetailUniqueCardlistTag : isCommanderDetailUniqueCardlistTag;
  const unique: ParsedCardListSection[] = [];
  const shared: ParsedCardListSection[] = [];

  for (const section of sections) {
    if (isUnique(section.tag)) {
      unique.push(section);
    } else {
      shared.push(section);
    }
  }

  return { unique, shared };
}

const AVERAGE_DECK_TAGS = new Set(["averagedeck", "average-deck", "averagedecklist"]);

const CARD_DETAIL_EXCLUDED_TAGS = new Set([
  "topcommanders",
  "highsynergycards",
  ...AVERAGE_DECK_TAGS,
]);

const COMMANDER_DETAIL_EXCLUDED_TAGS = new Set(["topcommanders"]);

/** EDHREC tribal / kindred tag slugs (normalized). */
const KINDRED_TAG_SLUGS = new Set([
  "aetherborn",
  "angels",
  "archers",
  "artificers",
  "assassins",
  "atogs",
  "auras",
  "avatars",
  "badgers",
  "basri",
  "beasts",
  "birds",
  "cats",
  "clerics",
  "constructs",
  "cyclops",
  "demons",
  "devils",
  "dinosaurs",
  "dragons",
  "druids",
  "dwarves",
  "elves",
  "faeries",
  "fish",
  "goblins",
  "golems",
  "gorgons",
  "horrors",
  "humans",
  "hydras",
  "insects",
  "knights",
  "kor",
  "merfolk",
  "minotaurs",
  "monks",
  "mutants",
  "myr",
  "nagas",
  "nephilim",
  "nights",
  "ninja",
  "ogres",
  "orcs",
  "phyrexians",
  "pirates",
  "plant",
  "plants",
  "rabbits",
  "rats",
  "rogues",
  "sagas",
  "samurai",
  "shapeshifters",
  "shamans",
  "slivers",
  "snakes",
  "soldiers",
  "spiders",
  "spirits",
  "squirrels",
  "thrulls",
  "treefolk",
  "turtles",
  "vampires",
  "warriors",
  "wizards",
  "wolves",
  "zombies",
]);

export function normalizeCardlists(cardlists: CardlistsInput): EdhrecCardList[] {
  if (!cardlists) {
    return [];
  }

  if (Array.isArray(cardlists)) {
    return cardlists.filter((list) => list?.header || list?.tag);
  }

  return Object.values(cardlists).filter((list) => list?.header || list?.tag);
}

function tagToSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function sectionPriorityFor(
  list: EdhrecCardList,
  priorityMap: Map<string, CardListSectionConfig>,
): number {
  const tag = list.tag?.toLowerCase() ?? "";
  const configured = priorityMap.get(tag);
  if (configured) {
    return configured.priority;
  }

  return 900;
}

function sectionShowSynergyFor(
  list: EdhrecCardList,
  priorityMap: Map<string, CardListSectionConfig>,
): boolean {
  const tag = list.tag?.toLowerCase() ?? "";
  return priorityMap.get(tag)?.showSynergy === true || tag === "highsynergycards";
}

function parseCardlistsSections(
  cardlists: CardlistsInput,
  options: {
    priorityMap: Map<string, CardListSectionConfig>;
    excludedTags: Set<string>;
    defaultLinkTo: "card" | "commander";
    linkCommanderTags?: Set<string>;
  },
): ParsedCardListSection[] {
  const normalized = normalizeCardlists(cardlists)
    .filter((list) => {
      const tag = list.tag?.toLowerCase() ?? "";
      return !options.excludedTags.has(tag);
    })
    .filter((list) => (list.cardviews?.length ?? 0) > 0);

  const sorted = [...normalized].sort((left, right) => {
    const priorityDiff =
      sectionPriorityFor(left, options.priorityMap) -
      sectionPriorityFor(right, options.priorityMap);
    if (priorityDiff !== 0) {
      return priorityDiff;
    }

    return (left.header ?? "").localeCompare(right.header ?? "");
  });

  return sorted.map((list, index) => {
    const tag = list.tag?.toLowerCase() ?? `section-${index}`;
    const linkTo = options.linkCommanderTags?.has(tag) ? "commander" : options.defaultLinkTo;

    return {
      id: tag || `section-${index}`,
      tag,
      header: list.header || list.tag || "Cards",
      cards: list.cardviews ?? [],
      showSynergy: sectionShowSynergyFor(list, options.priorityMap),
      linkTo,
    };
  });
}

export function parseCommanderCardlists(cardlists: CardlistsInput): ParsedCardListSection[] {
  return parseCardlistsSections(cardlists, {
    priorityMap: COMMANDER_SECTION_PRIORITY,
    excludedTags: COMMANDER_DETAIL_EXCLUDED_TAGS,
    defaultLinkTo: "card",
  });
}

export function parseCardDetailCardlists(cardlists: CardlistsInput): ParsedCardListSection[] {
  return parseCardlistsSections(cardlists, {
    priorityMap: CARD_DETAIL_SECTION_PRIORITY,
    excludedTags: CARD_DETAIL_EXCLUDED_TAGS,
    defaultLinkTo: "card",
    linkCommanderTags: new Set(["newcommanders"]),
  });
}

export function parseAverageDeckSections(cardlists: CardlistsInput): ParsedCardListSection[] {
  return parseCommanderCardlists(cardlists).filter((section) =>
    AVERAGE_DECK_TAGS.has(section.tag),
  );
}

export function getTopCommandersFromCardlists(cardlists: CardlistsInput): EdhrecCardView[] {
  for (const list of normalizeCardlists(cardlists)) {
    if (list.tag === "topcommanders" || list.header === "Top Commanders") {
      return list.cardviews ?? [];
    }
  }

  return [];
}

export function getTopCardsFromCommanderCardlists(cardlists: CardlistsInput): EdhrecCardView[] {
  const preferredTags = ["highsynergycards", "topcards"];

  for (const tag of preferredTags) {
    for (const list of normalizeCardlists(cardlists)) {
      if (list.tag === tag) {
        return list.cardviews ?? [];
      }
    }
  }

  for (const list of normalizeCardlists(cardlists)) {
    if (list.header === "High Synergy Cards" || list.header === "Top Cards") {
      return list.cardviews ?? [];
    }
  }

  return [];
}

export function isKindredTag(name: string): boolean {
  return KINDRED_TAG_SLUGS.has(tagToSlug(name));
}

export function splitTagCounts(tagCounts: Record<string, number>): {
  themes: { name: string; count: number }[];
  kindred: { name: string; count: number }[];
} {
  const themes: { name: string; count: number }[] = [];
  const kindred: { name: string; count: number }[] = [];

  for (const [name, count] of Object.entries(tagCounts)) {
    const entry = { name, count };
    if (isKindredTag(name)) {
      kindred.push(entry);
    } else {
      themes.push(entry);
    }
  }

  const byCount = (a: { count: number }, b: { count: number }) => b.count - a.count;

  return {
    themes: themes.sort(byCount),
    kindred: kindred.sort(byCount),
  };
}

export function getTopThemes(
  tagCounts: Record<string, number>,
  limit = 10,
): { name: string; count: number }[] {
  return splitTagCounts(tagCounts).themes.slice(0, limit);
}

export function formatInclusionPercent(
  inclusion: number | null,
  potentialDecks: number | null,
): string {
  return formatInclusionPercentFromDisplay(inclusion, potentialDecks);
}
