import { CardFaceTile } from "@/components/discovery/card-face-tile";
import type { CardRelative } from "@/lib/scryfall/card-relatives";
import { formatSubtypeList } from "@/lib/scryfall/type-utils";
import { CARD_FACE_DETAIL_GRID_CLASS } from "@/lib/ui/card-face";
import { DETAIL_SECTION_HEADING_CLASS, DETAIL_SECTION_IDS, DETAIL_SECTION_SCROLL_MARGIN } from "@/lib/ui/detail-section-nav";
import { detailSectionPanelClass } from "@/lib/ui/detail-section-nav";

type CardRelativesBySubtypeProps = {
  subtypes: string[];
  relatives: CardRelative[];
  uniqueToView?: boolean;
};

export function CardRelativesBySubtype({
  subtypes,
  relatives,
  uniqueToView = true,
}: CardRelativesBySubtypeProps) {
  if (subtypes.length === 0 || relatives.length === 0) {
    return null;
  }

  return (
    <section
      id={DETAIL_SECTION_IDS.relativesBySubtype}
      className={`${DETAIL_SECTION_SCROLL_MARGIN} ${detailSectionPanelClass(uniqueToView)}`}
    >
      <h2 className={DETAIL_SECTION_HEADING_CLASS}>Relatives by subtype</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Other Commander-legal cards sharing: {formatSubtypeList(subtypes)}
      </p>
      <ul className={`mt-4 ${CARD_FACE_DETAIL_GRID_CLASS}`}>
        {relatives.map((relative) => (
          <li key={`${relative.name}-${relative.typeLine}`}>
            <CardFaceTile
              href={relative.edhrecSlug ? `/cards/${relative.edhrecSlug}` : null}
              imageUri={relative.imageUri}
              name={relative.name}
              footer={
                <span className="min-w-0 truncate text-xs text-muted-foreground">
                  CMC {relative.cmc} · {relative.typeLine}
                </span>
              }
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
