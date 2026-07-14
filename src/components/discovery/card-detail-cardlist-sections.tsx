import type { CardlistsInput } from "@/lib/edhrec/cardlists";
import { parseCardDetailCardlists, partitionDetailCardlistSections } from "@/lib/edhrec/cardlists";
import { cardlistSectionAnchorId } from "@/lib/ui/detail-section-nav";

import { CardListSection } from "@/components/discovery/card-list-section";

type CardDetailCardlistSectionsProps = {
  cardlists: CardlistsInput;
  partition?: "all" | "unique" | "shared";
};

const DEFAULT_SECTION_LIMIT = 50;

export function CardDetailCardlistSections({
  cardlists,
  partition = "all",
}: CardDetailCardlistSectionsProps) {
  const sections = parseCardDetailCardlists(cardlists);

  if (sections.length === 0) {
    return null;
  }

  const { unique, shared } = partitionDetailCardlistSections(sections, "card");
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
          showSynergy={section.showSynergy}
          linkTo={section.linkTo}
          limit={DEFAULT_SECTION_LIMIT}
          uniqueToView={unique.includes(section)}
        />
      ))}
    </>
  );
}
