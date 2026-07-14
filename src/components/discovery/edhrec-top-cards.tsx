import type { CardlistsInput } from "@/lib/edhrec/cardlists";
import { getTopCardsFromCommanderCardlists } from "@/lib/edhrec/cardlists";

import { CardListSection } from "@/components/discovery/card-list-section";

type EdhrecTopCardsProps = {
  cardlists: CardlistsInput;
  numDecks?: number | null;
  title?: string;
};

export function EdhrecTopCards({
  cardlists,
  numDecks,
  title = "Top cards",
}: EdhrecTopCardsProps) {
  const cards = getTopCardsFromCommanderCardlists(cardlists).slice(0, 10);

  return (
    <CardListSection
      title={title}
      cards={cards}
      commanderNumDecks={numDecks}
      showSynergy={title.toLowerCase().includes("synergy")}
    />
  );
}
