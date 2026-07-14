import type { ParsedCardListSection } from "@/lib/edhrec/cardlists";
import {
  isCardDetailUniqueCardlistTag,
  isCommanderDetailUniqueCardlistTag,
  parseAverageDeckSections,
} from "@/lib/edhrec/cardlists";

/** Scroll margin so anchored sections clear the sticky section nav. */
export const DETAIL_SECTION_SCROLL_MARGIN = "scroll-mt-28";

export const DETAIL_SECTION_HEADING_CLASS =
  "text-sm font-semibold uppercase tracking-wide text-muted-foreground";

export const DETAIL_SECTION_PANEL_CLASS =
  "rounded-lg border border-border bg-card p-5 shadow-sm";

/** Subtle fill for sections that exist only on this detail view (not the card/commander counterpart). */
export const DETAIL_SECTION_UNIQUE_PANEL_CLASS =
  "rounded-lg border border-border bg-primary/5 p-5 shadow-sm";

export const DETAIL_SECTION_UNIQUE_NAV_CLASS = "rounded-r-md bg-primary/10";

/** Outer wrapper when inner blocks already render their own panels (e.g. average deck). */
export const DETAIL_SECTION_UNIQUE_WRAP_CLASS = "rounded-lg bg-primary/5 p-3";

export function detailSectionPanelClass(uniqueToView = false): string {
  return uniqueToView ? DETAIL_SECTION_UNIQUE_PANEL_CLASS : DETAIL_SECTION_PANEL_CLASS;
}

export const DETAIL_SECTION_IDS = {
  topCommanders: "top-commanders",
  deckThemes: "deck-themes",
  averageDeck: "average-deck",
  similarCards: "similar-cards",
  similarCommanders: "similar-commanders",
  relativesBySubtype: "relatives-by-subtype",
} as const;

const CARD_ONLY_SECTION_IDS = new Set<string>([
  DETAIL_SECTION_IDS.topCommanders,
  DETAIL_SECTION_IDS.similarCards,
  DETAIL_SECTION_IDS.relativesBySubtype,
]);

const COMMANDER_ONLY_SECTION_IDS = new Set<string>([
  DETAIL_SECTION_IDS.deckThemes,
  DETAIL_SECTION_IDS.averageDeck,
  DETAIL_SECTION_IDS.similarCommanders,
]);

export type DetailSectionNavItem = {
  id: string;
  label: string;
  uniqueToView?: boolean;
};

export function cardlistSectionAnchorId(sectionTag: string): string {
  return `cardlist-${sectionTag}`;
}

export function cardlistTagFromSectionId(sectionId: string): string | null {
  const prefix = "cardlist-";
  return sectionId.startsWith(prefix) ? sectionId.slice(prefix.length) : null;
}

export function isCardViewUniqueSectionId(sectionId: string): boolean {
  if (CARD_ONLY_SECTION_IDS.has(sectionId)) {
    return true;
  }

  const tag = cardlistTagFromSectionId(sectionId);
  return tag != null && isCardDetailUniqueCardlistTag(tag);
}

export function isCommanderViewUniqueSectionId(sectionId: string): boolean {
  if (COMMANDER_ONLY_SECTION_IDS.has(sectionId)) {
    return true;
  }

  const tag = cardlistTagFromSectionId(sectionId);
  return tag != null && isCommanderDetailUniqueCardlistTag(tag);
}

function sortNavItemsUniqueFirst(
  items: DetailSectionNavItem[],
  isUnique: (sectionId: string) => boolean,
): DetailSectionNavItem[] {
  const flagged = items.map((item) => ({
    ...item,
    uniqueToView: isUnique(item.id),
  }));

  return [
    ...flagged.filter((item) => item.uniqueToView),
    ...flagged.filter((item) => !item.uniqueToView),
  ];
}

export function cardlistSectionNavItems(
  sections: ParsedCardListSection[],
): DetailSectionNavItem[] {
  return sections.map((section) => ({
    id: cardlistSectionAnchorId(section.id),
    label: section.header,
  }));
}

export function commanderCardlistSectionsForNav(
  cardlists: Parameters<typeof parseAverageDeckSections>[0],
  sections: ParsedCardListSection[],
): ParsedCardListSection[] {
  const averageDeckIds = new Set(
    parseAverageDeckSections(cardlists).map((section) => section.id),
  );

  return sections.filter((section) => !averageDeckIds.has(section.id));
}

export function buildCardDetailNavItems(input: {
  hasTopCommanders: boolean;
  cardlistSections: ParsedCardListSection[];
  hasSimilarCards: boolean;
  hasRelatives: boolean;
}): DetailSectionNavItem[] {
  const items: DetailSectionNavItem[] = [];

  if (input.hasTopCommanders) {
    items.push({ id: DETAIL_SECTION_IDS.topCommanders, label: "Top commanders" });
  }

  items.push(...cardlistSectionNavItems(input.cardlistSections));

  if (input.hasSimilarCards) {
    items.push({ id: DETAIL_SECTION_IDS.similarCards, label: "Similar cards" });
  }

  if (input.hasRelatives) {
    items.push({ id: DETAIL_SECTION_IDS.relativesBySubtype, label: "Relatives by subtype" });
  }

  return sortNavItemsUniqueFirst(items, isCardViewUniqueSectionId);
}

export function buildCommanderDetailNavItems(input: {
  hasThemes: boolean;
  cardlistSections: ParsedCardListSection[];
  hasAverageDeck: boolean;
  hasSimilarCommanders: boolean;
}): DetailSectionNavItem[] {
  const items: DetailSectionNavItem[] = [];

  if (input.hasThemes) {
    items.push({ id: DETAIL_SECTION_IDS.deckThemes, label: "Deck themes" });
  }

  items.push(...cardlistSectionNavItems(input.cardlistSections));

  if (input.hasAverageDeck) {
    items.push({ id: DETAIL_SECTION_IDS.averageDeck, label: "Average deck" });
  }

  if (input.hasSimilarCommanders) {
    items.push({ id: DETAIL_SECTION_IDS.similarCommanders, label: "Similar commanders" });
  }

  return sortNavItemsUniqueFirst(items, isCommanderViewUniqueSectionId);
}
