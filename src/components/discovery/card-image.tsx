import Image from "next/image";

import { CARD_DETAIL_IMAGE_MAX_CLASS } from "@/lib/ui/layout";
import { CARD_FACE_RADIUS_CLASS, cardFacePlaceholderClassName } from "@/lib/ui/card-face";

type CardImageProps = {
  src: string;
  alt: string;
  variant?: "thumbnail" | "detail" | "grid";
};

const variantStyles = {
  thumbnail: "h-[62px] w-[44px]",
  detail: `aspect-[488/680] w-full ${CARD_DETAIL_IMAGE_MAX_CLASS}`,
  grid: "aspect-[488/680] w-full",
} as const;

export function CardImage({ src, alt, variant = "thumbnail" }: CardImageProps) {
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
