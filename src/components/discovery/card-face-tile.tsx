import type { ReactNode } from "react";

import { CardMultifaceImage } from "@/components/discovery/card-multiface-image";
import type { PrintingFinish } from "@/lib/scryfall/card-printing";
import type { CardFaceImage } from "@/lib/scryfall/faces";

type CardFaceTileProps = {
  href?: string | null;
  imageUri?: string | null;
  faces?: CardFaceImage[] | null;
  name: string;
  /** Collection / printing-known tiles — drives CSS foil/etched sheen. */
  finish?: PrintingFinish | null;
  footer?: ReactNode;
};

/**
 * Browse/detail grid cell. Link hits the card face only (not the footer metrics).
 */
export function CardFaceTile({
  href,
  imageUri,
  faces,
  name,
  finish = null,
  footer,
}: CardFaceTileProps) {
  return (
    <article>
      <CardMultifaceImage
        href={href}
        imageUri={imageUri}
        faces={faces}
        name={name}
        variant="grid"
        finish={finish}
      />
      {footer ? <div className="mt-2 w-full min-w-0">{footer}</div> : null}
    </article>
  );
}
