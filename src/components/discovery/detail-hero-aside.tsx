import type { ReactNode } from "react";

import { CardImage } from "@/components/discovery/card-image";
import { DetailSectionNav } from "@/components/discovery/detail-section-nav";
import type { DetailSectionNavItem } from "@/lib/ui/detail-section-nav";
import { CARD_FACE_RADIUS_CLASS } from "@/lib/ui/card-face";
import { DETAIL_SECTION_NAV_STICKY_CLASS } from "@/lib/ui/layout";

type DetailHeroAsideProps = {
  imageUri: string | null;
  imageAlt: string;
  setName?: string | null;
  setCode?: string | null;
  /** Unified prices / primary / decks / salt (and synergy when relevant) under the image. */
  previewFooter?: ReactNode;
  sectionNavItems?: DetailSectionNavItem[];
};

export function DetailHeroAside({
  imageUri,
  imageAlt,
  setName,
  setCode,
  previewFooter,
  sectionNavItems = [],
}: DetailHeroAsideProps) {
  return (
    // Stretch with the detail grid row so sticky TOC can pin while the main column scrolls.
    <div className="relative mx-auto w-full max-w-[300px] shrink-0 lg:mx-0 lg:h-full lg:w-[300px] lg:max-w-none">
      <aside className="flex w-full flex-col gap-3 lg:h-full">
        <div className="mx-auto w-full shrink-0 lg:mx-0">
          {imageUri ? (
            <CardImage src={imageUri} alt={imageAlt} variant="detail" />
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
            Showing {setName} ({setCode.toUpperCase()}) printing
          </p>
        ) : null}

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
