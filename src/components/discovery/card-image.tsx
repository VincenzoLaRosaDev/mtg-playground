import Image from "next/image";

import type { PrintingFinish } from "@/lib/scryfall/card-printing";
import { CARD_DETAIL_IMAGE_MAX_CLASS } from "@/lib/ui/layout";
import { CARD_FACE_RADIUS_CLASS, cardFacePlaceholderClassName } from "@/lib/ui/card-face";
import { cn } from "@/lib/utils";

type CardImageProps = {
  src: string;
  alt: string;
  variant?: "thumbnail" | "detail" | "grid";
  /** Scryfall uses the same art for foil — overlay when finish is foil/etched. */
  finish?: PrintingFinish | null;
};

const variantStyles = {
  thumbnail: "h-[62px] w-[44px]",
  detail: `aspect-[488/680] w-full ${CARD_DETAIL_IMAGE_MAX_CLASS}`,
  grid: "aspect-[488/680] w-full",
} as const;

/**
 * Scryfall serves one art URI per printing. Foil/etched are visual layers only
 * (Archidekt-style rainbow sheen + glare).
 */
export function CardFinishOverlay({ finish }: { finish?: PrintingFinish | null }) {
  if (finish !== "foil" && finish !== "etched") {
    return null;
  }

  const etched = finish === "etched";

  return (
    <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden" aria-hidden>
      {/* Prismatic wash — color-dodge reads on dark art like Archidekt */}
      <div
        className={cn(
          "absolute inset-0",
          etched ? "card-finish-etched-wash" : "card-finish-foil-wash",
        )}
      />
      {/* Moving specular glare band */}
      <div
        className={cn(
          "absolute inset-y-0",
          etched ? "card-finish-etched-glare" : "card-finish-foil-glare",
        )}
      />
    </div>
  );
}

export function CardImage({ src, alt, variant = "thumbnail", finish = null }: CardImageProps) {
  return (
    <div
      className={`relative shrink-0 overflow-hidden ${CARD_FACE_RADIUS_CLASS} ${variantStyles[variant]}`}
    >
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover"
        sizes={variant === "thumbnail" ? "44px" : variant === "grid" ? "300px" : "300px"}
        unoptimized
      />
      <CardFinishOverlay finish={finish} />
    </div>
  );
}

export function CardFacePlaceholder({
  variant = "thumbnail",
  label = "?",
}: {
  variant?: "thumbnail" | "detail" | "grid";
  label?: string;
}) {
  return <div className={`${cardFacePlaceholderClassName(variant)} text-xs`}>{label}</div>;
}
