import type { CardlistsInput } from "@/lib/edhrec/cardlists";
import { getTopCommandersFromCardlists } from "@/lib/edhrec/cardlists";
import { DETAIL_SECTION_HEADING_CLASS, DETAIL_SECTION_IDS } from "@/lib/ui/detail-section-nav";
import { detailSectionPanelClass } from "@/lib/ui/detail-section-nav";

import { CardListSection } from "@/components/discovery/card-list-section";

type EdhrecTopCommandersProps = {
  cardlists: CardlistsInput;
  uniqueToView?: boolean;
};

export async function EdhrecTopCommanders({
  cardlists,
  uniqueToView = true,
}: EdhrecTopCommandersProps) {
  const commanders = getTopCommandersFromCardlists(cardlists).slice(0, 10);

  if (commanders.length === 0) {
    return (
      <section className={detailSectionPanelClass(uniqueToView)}>
        <h2 className={DETAIL_SECTION_HEADING_CLASS}>Top commanders</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Popularity data for commanders playing this card is not available yet.
        </p>
      </section>
    );
  }

  return (
    <CardListSection
      sectionId={DETAIL_SECTION_IDS.topCommanders}
      title="Top commanders"
      cards={commanders}
      showSynergy
      linkTo="commander"
      uniqueToView={uniqueToView}
    />
  );
}
