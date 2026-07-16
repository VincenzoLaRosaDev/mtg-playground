import { CardFaceTile } from "@/components/discovery/card-face-tile";
import { EntityPreviewFooter } from "@/components/discovery/entity-preview-footer";
import { loadSimilarCards } from "@/lib/edhrec/similar-cards";
import { formatInclusionPercent } from "@/lib/display/formatters";
import { prisma } from "@/lib/db";
import { CARD_FACE_DETAIL_GRID_CLASS } from "@/lib/ui/card-face";
import {
  DETAIL_SECTION_HEADING_CLASS,
  DETAIL_SECTION_IDS,
  DETAIL_SECTION_SCROLL_MARGIN,
  detailSectionPanelClass,
} from "@/lib/ui/detail-section-nav";

type EdhrecSimilarCardsProps = {
  similarCards: string[];
  uniqueToView?: boolean;
};

export async function EdhrecSimilarCards({
  similarCards,
  uniqueToView = true,
}: EdhrecSimilarCardsProps) {
  const cards = await loadSimilarCards(prisma, similarCards, 8);

  if (cards.length === 0) {
    return null;
  }

  return (
    <section
      id={DETAIL_SECTION_IDS.similarCards}
      className={`${DETAIL_SECTION_SCROLL_MARGIN} ${detailSectionPanelClass(uniqueToView)}`}
    >
      <h2 className={DETAIL_SECTION_HEADING_CLASS}>Similar cards</h2>

      <ul className={`mt-4 ${CARD_FACE_DETAIL_GRID_CLASS}`}>
        {cards.map((card) => (
          <li key={card.slug}>
            <CardFaceTile
              href={`/cards/${card.slug}`}
              imageUri={card.imageUri}
              name={card.name}
              footer={
                <EntityPreviewFooter
                  prices={card.prices}
                  primary={{
                    kind: "inclusion",
                    value: formatInclusionPercent(
                      card.inclusion,
                      card.potentialDecks,
                      card.numDecks,
                    ),
                  }}
                  decks={card.numDecks}
                  salt={card.salt}
                />
              }
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
