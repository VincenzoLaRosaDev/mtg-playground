import { CardFaceMetricFooter } from "@/components/discovery/card-face-metric-footer";
import { CardFaceTile } from "@/components/discovery/card-face-tile";
import { loadCatalogCardFacesBySlugs } from "@/lib/catalog/card-faces";
import { prisma } from "@/lib/db";
import type { EdhrecCardView } from "@/lib/edhrec/types";
import { CARD_FACE_DETAIL_GRID_CLASS } from "@/lib/ui/card-face";
import {
  DETAIL_SECTION_SCROLL_MARGIN,
  DETAIL_SECTION_HEADING_CLASS,
  detailSectionPanelClass,
} from "@/lib/ui/detail-section-nav";

type CardListSectionProps = {
  title: string;
  cards: EdhrecCardView[];
  commanderNumDecks?: number | null;
  showSynergy?: boolean;
  limit?: number;
  linkTo?: "card" | "commander";
  sectionId?: string;
  uniqueToView?: boolean;
};

export async function CardListSection({
  title,
  cards,
  commanderNumDecks,
  showSynergy = false,
  limit,
  linkTo = "card",
  sectionId,
  uniqueToView = false,
}: CardListSectionProps) {
  if (cards.length === 0) {
    return null;
  }

  const visibleCards = limit != null ? cards.slice(0, limit) : cards;
  const slugs = visibleCards
    .map((card) => card.sanitized)
    .filter((slug): slug is string => Boolean(slug));
  const faces = await loadCatalogCardFacesBySlugs(prisma, slugs);

  return (
    <section
      id={sectionId}
      className={`${sectionId ? DETAIL_SECTION_SCROLL_MARGIN : ""} ${detailSectionPanelClass(uniqueToView)}`}
    >
      <h2 className={DETAIL_SECTION_HEADING_CLASS}>{title}</h2>
      <ul className={`mt-4 ${CARD_FACE_DETAIL_GRID_CLASS}`}>
        {visibleCards.map((card) => {
          const slug = card.sanitized;
          const face = slug ? faces.get(slug) : undefined;
          const href = slug
            ? linkTo === "commander"
              ? `/commanders/${slug}`
              : `/cards/${slug}`
            : null;

          return (
            <li key={slug ?? card.name}>
              <CardFaceTile
                href={href}
                imageUri={face?.imageUri ?? null}
                name={face?.name ?? card.name}
                footer={
                  <CardFaceMetricFooter
                    card={card}
                    commanderNumDecks={commanderNumDecks}
                    showSynergy={showSynergy}
                    prices={face?.prices}
                    salt={face?.salt ?? card.salt ?? null}
                  />
                }
              />
            </li>
          );
        })}
      </ul>
      {limit != null && cards.length > limit ? (
        <p className="mt-4 text-xs text-muted-foreground">
          Showing {limit} of {cards.length} cards.
        </p>
      ) : null}
    </section>
  );
}
