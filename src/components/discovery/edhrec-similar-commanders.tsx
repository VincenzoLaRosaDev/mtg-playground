import { CardFaceTile } from "@/components/discovery/card-face-tile";
import { EntityPreviewFooter } from "@/components/discovery/entity-preview-footer";
import { loadSimilarCommanders } from "@/lib/edhrec/similar-commanders";
import { formatRank } from "@/lib/display/formatters";
import { prisma } from "@/lib/db";
import { CARD_FACE_DETAIL_GRID_CLASS } from "@/lib/ui/card-face";
import {
  DETAIL_SECTION_HEADING_CLASS,
  DETAIL_SECTION_IDS,
  DETAIL_SECTION_SCROLL_MARGIN,
  detailSectionPanelClass,
} from "@/lib/ui/detail-section-nav";

type EdhrecSimilarCommandersProps = {
  similarSlugs: string[];
  uniqueToView?: boolean;
};

export async function EdhrecSimilarCommanders({
  similarSlugs,
  uniqueToView = true,
}: EdhrecSimilarCommandersProps) {
  const commanders = await loadSimilarCommanders(prisma, similarSlugs, 8);

  if (commanders.length === 0) {
    return null;
  }

  return (
    <section
      id={DETAIL_SECTION_IDS.similarCommanders}
      className={`${DETAIL_SECTION_SCROLL_MARGIN} ${detailSectionPanelClass(uniqueToView)}`}
    >
      <h2 className={DETAIL_SECTION_HEADING_CLASS}>Similar commanders</h2>

      <ul className={`mt-4 ${CARD_FACE_DETAIL_GRID_CLASS}`}>
        {commanders.map((commander) => (
          <li key={commander.slug}>
            <CardFaceTile
              href={`/commanders/${commander.slug}`}
              imageUri={commander.imageUri}
              name={commander.name}
              footer={
                <EntityPreviewFooter
                  prices={commander.prices}
                  primary={{
                    kind: "rank",
                    value: formatRank(commander.rank),
                  }}
                  decks={commander.numDecks}
                  salt={commander.salt}
                />
              }
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
