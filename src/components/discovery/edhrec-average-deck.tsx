import type { CardlistsInput } from "@/lib/edhrec/cardlists";
import { parseAverageDeckSections } from "@/lib/edhrec/cardlists";
import {
  DETAIL_SECTION_IDS,
  DETAIL_SECTION_SCROLL_MARGIN,
  DETAIL_SECTION_UNIQUE_WRAP_CLASS,
} from "@/lib/ui/detail-section-nav";

import { CardListSection } from "@/components/discovery/card-list-section";

type EdhrecAverageDeckProps = {
  cardlists: CardlistsInput;
  numDecks?: number | null;
  uniqueToView?: boolean;
};

export function EdhrecAverageDeck({
  cardlists,
  numDecks,
  uniqueToView = true,
}: EdhrecAverageDeckProps) {
  const sections = parseAverageDeckSections(cardlists);

  if (sections.length === 0) {
    return null;
  }

  return (
    <div
      id={DETAIL_SECTION_IDS.averageDeck}
      className={`${DETAIL_SECTION_SCROLL_MARGIN} ${
        uniqueToView ? DETAIL_SECTION_UNIQUE_WRAP_CLASS : ""
      } space-y-5`}
    >
      {sections.map((section) => (
        <CardListSection
          key={section.id}
          title="Average deck"
          cards={section.cards}
          commanderNumDecks={numDecks}
        />
      ))}
    </div>
  );
}
