import type { CardlistsInput } from "@/lib/edhrec/cardlists";
import {
  parseAverageDeckSections,
  parseCommanderCardlists,
  partitionDetailCardlistSections,
} from "@/lib/edhrec/cardlists";
import { cardlistSectionAnchorId } from "@/lib/ui/detail-section-nav";

import { CardListSection } from "@/components/discovery/card-list-section";

type CommanderCardlistSectionsProps = {
  cardlists: CardlistsInput;
  numDecks?: number | null;
  partition?: "all" | "unique" | "shared";
};

const DEFAULT_SECTION_LIMIT = 50;

export function CommanderCardlistSections({
  cardlists,
  numDecks,
  partition = "all",
}: CommanderCardlistSectionsProps) {
  const sections = parseCommanderCardlists(cardlists);
  const averageDeckIds = new Set(
    parseAverageDeckSections(cardlists).map((section) => section.id),
  );
  const visibleSections = sections.filter((section) => !averageDeckIds.has(section.id));

  if (visibleSections.length === 0) {
    return null;
  }

  const { unique, shared } = partitionDetailCardlistSections(visibleSections, "commander");
  const sectionsToRender =
    partition === "unique" ? unique : partition === "shared" ? shared : [...unique, ...shared];

  if (sectionsToRender.length === 0) {
    return null;
  }

  return (
    <>
      {sectionsToRender.map((section) => (
        <CardListSection
          key={section.id}
          sectionId={cardlistSectionAnchorId(section.id)}
          title={section.header}
          cards={section.cards}
          commanderNumDecks={numDecks}
          showSynergy={section.showSynergy}
          limit={DEFAULT_SECTION_LIMIT}
          uniqueToView={unique.includes(section)}
        />
      ))}
    </>
  );
}
