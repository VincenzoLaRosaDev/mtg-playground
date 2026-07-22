"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

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

/** `animate` = detail idle loop; `hover` = grid/collection (no idle animation). */
export type FinishGlareMotion = "animate" | "hover";

const variantStyles = {
  thumbnail: "h-[62px] w-[44px]",
  detail: `aspect-[488/680] w-full ${CARD_DETAIL_IMAGE_MAX_CLASS}`,
  grid: "aspect-[488/680] w-full",
} as const;

/**
 * Scryfall serves one art URI per printing. Foil/etched are visual layers only
 * (Archidekt-style rainbow sheen + glare).
 */
export function CardFinishOverlay({
  finish,
  glareMotion = "animate",
}: {
  finish?: PrintingFinish | null;
  glareMotion?: FinishGlareMotion;
}) {
  if (finish !== "foil" && finish !== "etched") {
    return null;
  }

  const etched = finish === "etched";
  const glareTone = etched ? "card-finish-etched-glare" : "card-finish-foil-glare";

  return (
    <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden" aria-hidden>
      <div
        className={cn(
          "absolute inset-0",
          etched ? "card-finish-etched-wash" : "card-finish-foil-wash",
        )}
      />
      {glareMotion === "animate" ? (
        <div className={cn(glareTone, "card-finish-glare-idle")} />
      ) : null}
      <div
        className={cn(
          glareTone,
          "card-finish-glare-follow",
          glareMotion === "hover" && "card-finish-glare-hover",
        )}
      />
    </div>
  );
}

export function glareMotionForVariant(
  variant: "thumbnail" | "detail" | "grid",
): FinishGlareMotion {
  return variant === "detail" ? "animate" : "hover";
}

export function CardImage({ src, alt, variant = "thumbnail", finish = null }: CardImageProps) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(false);
  }, [src]);

  return (
    <div
      className={cn(
        "group/finish relative shrink-0 overflow-hidden",
        CARD_FACE_RADIUS_CLASS,
        variantStyles[variant],
      )}
    >
      {!loaded ? (
        <div className="absolute inset-0 animate-pulse bg-muted" aria-hidden />
      ) : null}
      <Image
        src={src}
        alt={alt}
        fill
        className={cn("object-cover transition-opacity", loaded ? "opacity-100" : "opacity-0")}
        sizes={variant === "thumbnail" ? "44px" : "300px"}
        unoptimized
        onLoad={() => setLoaded(true)}
      />
      <CardFinishOverlay finish={finish} glareMotion={glareMotionForVariant(variant)} />
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
