import Link from "next/link";
import type { ReactNode } from "react";

import { CardFacePlaceholder, CardImage } from "@/components/discovery/card-image";

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

      {footer ? <div className="mt-2 w-full min-w-0">{footer}</div> : null}
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
