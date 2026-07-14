import { CardFaceTile } from "@/components/discovery/card-face-tile";
import { RankBadge } from "@/components/discovery/rank-badge";
import { COMMANDER_DETAIL_RANK_LABEL } from "@/lib/edhrec/commander-rank";
import { loadSimilarCommanders } from "@/lib/edhrec/similar-commanders";
import { prisma } from "@/lib/db";
import { CARD_FACE_GRID_CLASS } from "@/lib/ui/card-face";
import { DETAIL_SECTION_HEADING_CLASS, DETAIL_SECTION_IDS, DETAIL_SECTION_SCROLL_MARGIN } from "@/lib/ui/detail-section-nav";
import { detailSectionPanelClass } from "@/lib/ui/detail-section-nav";

type EdhrecSimilarCommandersProps = {
  similarSlugs: string[];
  uniqueToView?: boolean;
};

const ALL_TIME_RANK_TITLE = `${COMMANDER_DETAIL_RANK_LABEL} EDHREC rank`;

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
      <p className="mt-1 text-xs text-muted-foreground">
        Rank is {COMMANDER_DETAIL_RANK_LABEL.toLowerCase()} EDHREC popularity (not browse time window).
      </p>

      <ul className={`mt-4 ${CARD_FACE_GRID_CLASS}`}>
        {commanders.map((commander) => (
          <li key={commander.slug}>
            <CardFaceTile
              href={`/commanders/${commander.slug}`}
              imageUri={commander.imageUri}
              name={commander.name}
              footer={
                commander.rank != null || commander.numDecks != null ? (
                  <>
                    {commander.rank != null ? (
                      <RankBadge rank={commander.rank} title={ALL_TIME_RANK_TITLE} className="shrink-0" />
                    ) : null}
                    {commander.numDecks != null ? (
                      <span className="shrink-0 whitespace-nowrap text-xs tabular-nums text-muted-foreground">
                        {commander.numDecks.toLocaleString()} decks
                      </span>
                    ) : null}
                  </>
                ) : null
              }
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
