"use client";

import { CardFaceTile } from "@/components/discovery/card-face-tile";
import { useCardDetailModal } from "@/components/discovery/card-detail-modal-provider";
import { EntityPreviewFooter } from "@/components/discovery/entity-preview-footer";
import type { CardRelative } from "@/lib/scryfall/card-relatives";
import { formatSubtypeList } from "@/lib/scryfall/type-utils";
import { cardFaceDetailGridClass } from "@/lib/ui/card-face";
import {
  DETAIL_SECTION_HEADING_CLASS,
  DETAIL_SECTION_IDS,
  DETAIL_SECTION_SCROLL_MARGIN,
  detailSectionPanelClass,
} from "@/lib/ui/detail-section-nav";

type CardRelativesBySubtypeProps = {
  subtypes: string[];
  relatives: CardRelative[];
  /** Full-width lists band (no sticky TOC) — denser columns from `lg`. */
  wideGrid?: boolean;
  gridDensity?: "page" | "sheet";
};

export function CardRelativesBySubtype({
  subtypes,
  relatives,
  wideGrid = false,
  gridDensity = "page",
}: CardRelativesBySubtypeProps) {
  const { openCardDetail } = useCardDetailModal();

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
      <ul className={`mt-4 ${cardFaceDetailGridClass(wideGrid, gridDensity)}`}>
        {relatives.map((relative) => (
          <li key={`${relative.name}-${relative.typeLine}`}>
            <CardFaceTile
              href={relative.slug ? `/cards/${relative.slug}` : null}
              onOpen={
                relative.slug
                  ? () =>
                      openCardDetail({
                        mode: "collection",
                        slug: relative.slug!,
                        imageUri: relative.imageUri,
                        faces: relative.faces,
                      })
                  : undefined
              }
              imageUri={relative.imageUri}
              faces={relative.faces}
              name={relative.name}
              footer={
                <EntityPreviewFooter
                  prices={relative.prices}
                  popularityRank={relative.popularityRank}
                />
              }
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
