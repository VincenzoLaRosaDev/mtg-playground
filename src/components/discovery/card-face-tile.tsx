import type { ReactNode } from "react";

import { CardMultifaceImage } from "@/components/discovery/card-multiface-image";
import type { CardFaceImage } from "@/lib/scryfall/faces";

type CardFaceTileProps = {
  href?: string | null;
  imageUri?: string | null;
  faces?: CardFaceImage[] | null;
  name: string;
  footer?: ReactNode;
};

/**
 * Browse/detail grid cell. Link hits the card face only (not the footer metrics).
 */
export function CardFaceTile({ href, imageUri, faces, name, footer }: CardFaceTileProps) {
  return (
    <article>
      <CardMultifaceImage
        href={href}
        imageUri={imageUri}
        faces={faces}
        name={name}
        variant="grid"
      />
      {footer ? <div className="mt-2 w-full min-w-0">{footer}</div> : null}
    </article>
  );
}
