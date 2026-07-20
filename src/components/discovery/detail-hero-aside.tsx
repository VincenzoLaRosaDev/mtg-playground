import type { ReactNode } from "react";

import { CardMultifaceImage } from "@/components/discovery/card-multiface-image";
import { DetailSectionNav } from "@/components/discovery/detail-section-nav";
import type { CardFaceImage } from "@/lib/scryfall/faces";
import type { DetailSectionNavItem } from "@/lib/ui/detail-section-nav";
import { CARD_FACE_RADIUS_CLASS } from "@/lib/ui/card-face";
import { DETAIL_SECTION_NAV_STICKY_CLASS } from "@/lib/ui/layout";

type DetailHeroAsideProps = {
  imageUri: string | null;
  faces?: CardFaceImage[] | null;
  imageAlt: string;
  setName?: string | null;
  setCode?: string | null;
  collectorNumber?: string | null;
  /** Version picker (set / cn / finish). */
  versionPicker?: ReactNode;
  /** Unified prices / primary / decks / salt (and synergy when relevant) under the image. */
  previewFooter?: ReactNode;
  sectionNavItems?: DetailSectionNavItem[];
};

export function DetailHeroAside({
  imageUri,
  faces,
  imageAlt,
  setName,
  setCode,
  collectorNumber,
  versionPicker,
  previewFooter,
  sectionNavItems = [],
}: DetailHeroAsideProps) {
  return (
    // Stretch with the detail grid row so sticky TOC can pin while the main column scrolls.
    <div className="relative mx-auto w-full max-w-[300px] shrink-0 lg:mx-0 lg:h-full lg:w-[300px] lg:max-w-none">
      <aside className="flex w-full flex-col gap-3 lg:h-full">
        <div className="mx-auto w-full shrink-0 lg:mx-0">
          {imageUri || (faces && faces.length > 0) ? (
            <CardMultifaceImage
              imageUri={imageUri}
              faces={faces}
              name={imageAlt}
              variant="detail"
            />
          ) : (
            <div
              className={`flex aspect-488/680 w-full items-center justify-center ${CARD_FACE_RADIUS_CLASS} border border-border bg-muted text-sm text-muted-foreground`}
            >
              No image available
            </div>
          )}
        </div>

        {setName && setCode ? (
          <p className="shrink-0 text-xs text-muted-foreground">
            {setName} ({setCode.toUpperCase()})
            {collectorNumber ? ` #${collectorNumber}` : ""}
          </p>
        ) : null}

        {versionPicker ? <div className="shrink-0">{versionPicker}</div> : null}

        {previewFooter ? <div className="shrink-0">{previewFooter}</div> : null}

        {sectionNavItems.length >= 2 ? (
          <div className={DETAIL_SECTION_NAV_STICKY_CLASS}>
            <DetailSectionNav items={sectionNavItems} />
          </div>
        ) : null}
      </aside>
    </div>
  );
}
