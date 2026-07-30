import { CardMultifaceImage } from "@/components/discovery/card-multiface-image";
import type { CardFaceImage } from "@/lib/scryfall/faces";
import type { PrintingFinish } from "@/lib/scryfall/card-printing";
import { CARD_FACE_RADIUS_CLASS } from "@/lib/ui/card-face";
import { CARD_DETAIL_IMAGE_COLUMN_CLASS } from "@/lib/ui/layout";

type DetailHeroAsideProps = {
  imageUri: string | null;
  faces?: CardFaceImage[] | null;
  imageAlt: string;
  /** Scryfall shares foil/nonfoil art — CSS overlay distinguishes finish. */
  finish?: PrintingFinish | null;
  setName?: string | null;
  setCode?: string | null;
  collectorNumber?: string | null;
};

/** Image column for card overview — set/cn caption only; controls live in the details panel. */
export function DetailHeroAside({
  imageUri,
  faces,
  imageAlt,
  finish = null,
  setName,
  setCode,
  collectorNumber,
}: DetailHeroAsideProps) {
  return (
    <div className={CARD_DETAIL_IMAGE_COLUMN_CLASS}>
      <aside className="flex w-full flex-col gap-3">
        <div className="mx-auto w-full shrink-0 sm:mx-0">
          {imageUri || (faces && faces.length > 0) ? (
            <CardMultifaceImage
              imageUri={imageUri}
              faces={faces}
              name={imageAlt}
              variant="detail"
              finish={finish}
              priority
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
          <p className="shrink-0 text-sm text-muted-foreground">
            {setName} ({setCode.toUpperCase()})
            {collectorNumber ? ` #${collectorNumber}` : ""}
          </p>
        ) : null}
      </aside>
    </div>
  );
}
