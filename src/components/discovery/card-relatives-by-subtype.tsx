import { CardFaceTile } from "@/components/discovery/card-face-tile";
import { EntityPreviewFooter } from "@/components/discovery/entity-preview-footer";
import type { CardRelative } from "@/lib/scryfall/card-relatives";
import { formatSubtypeList } from "@/lib/scryfall/type-utils";
import { CARD_FACE_DETAIL_GRID_CLASS } from "@/lib/ui/card-face";
import {
  DETAIL_SECTION_HEADING_CLASS,
  DETAIL_SECTION_IDS,
  DETAIL_SECTION_SCROLL_MARGIN,
  detailSectionPanelClass,
} from "@/lib/ui/detail-section-nav";

type CardRelativesBySubtypeProps = {
  subtypes: string[];
  relatives: CardRelative[];
};

export function CardRelativesBySubtype({
  subtypes,
  relatives,
}: CardRelativesBySubtypeProps) {
  if (subtypes.length === 0 || relatives.length === 0) {
    return null;
  }

  return (
    <section
      id={DETAIL_SECTION_IDS.relativesBySubtype}
      className={`${DETAIL_SECTION_SCROLL_MARGIN} ${detailSectionPanelClass()}`}
    >
      <h2 className={DETAIL_SECTION_HEADING_CLASS}>Relatives by subtype</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Other Commander-legal cards sharing: {formatSubtypeList(subtypes)}
      </p>
      <ul className={`mt-4 ${CARD_FACE_DETAIL_GRID_CLASS}`}>
        {relatives.map((relative) => (
          <li key={`${relative.name}-${relative.typeLine}`}>
            <CardFaceTile
              href={relative.slug ? `/cards/${relative.slug}` : null}
              imageUri={relative.imageUri}
              faces={relative.faces}
              name={relative.name}
              footer={
                <EntityPreviewFooter
                  prices={relative.prices}
                  popularityRank={relative.popularityRank}
                  frictionScore={relative.frictionScore}
                />
              }
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
