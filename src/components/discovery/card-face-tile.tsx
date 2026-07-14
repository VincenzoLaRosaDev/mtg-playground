import Link from "next/link";
import type { ReactNode } from "react";

import { CardFacePlaceholder, CardImage } from "@/components/discovery/card-image";
import { CARD_FACE_TILE_FOOTER_CLASS } from "@/lib/ui/card-face";

type CardFaceTileProps = {
  href?: string | null;
  imageUri?: string | null;
  name: string;
  footer?: ReactNode;
};

export function CardFaceTile({ href, imageUri, name, footer }: CardFaceTileProps) {
  const content = (
    <>
      {imageUri ? (
        <CardImage src={imageUri} alt={name} variant="grid" />
      ) : (
        <CardFacePlaceholder variant="grid" label={name} />
      )}

      {footer ? <div className={CARD_FACE_TILE_FOOTER_CLASS}>{footer}</div> : null}
    </>
  );

  if (href) {
    return (
      <Link href={href} className="block transition-opacity hover:opacity-90">
        {content}
      </Link>
    );
  }

  return <article>{content}</article>;
}
