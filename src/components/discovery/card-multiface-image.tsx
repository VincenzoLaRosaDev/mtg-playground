"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type ReactNode } from "react";

import {
  CardFacePlaceholder,
  CardFinishOverlay,
  CardImage,
} from "@/components/discovery/card-image";
import { CardTilt } from "@/components/discovery/card-tilt";
import type { PrintingFinish } from "@/lib/scryfall/card-printing";
import { canFlipFaces, flipFaceUris, type CardFaceImage } from "@/lib/scryfall/faces";
import { CARD_FACE_ASPECT_CLASS, CARD_FACE_RADIUS_CLASS } from "@/lib/ui/card-face";
import { cn } from "@/lib/utils";

type CardMultifaceImageProps = {
  imageUri?: string | null;
  faces?: CardFaceImage[] | null;
  name: string;
  variant?: "thumbnail" | "detail" | "grid";
  /** When set, the stack links to this href. */
  href?: string | null;
  finish?: PrintingFinish | null;
};

/** Fraction of the tile reserved so the back offset stays inside the same aspect box. */
const STACK_WIDTH = "89%";
const STACK_HEIGHT = "91%";
const BACK_OFFSET_X = "11%";
const BACK_OFFSET_Y = "-9%";

function StackFace({
  src,
  alt,
  sizes,
  finish,
}: {
  src: string;
  alt: string;
  sizes: string;
  finish?: PrintingFinish | null;
}) {
  return (
    <div
      className={cn(
        "relative h-full w-full overflow-hidden shadow-md ring-1 ring-black/25",
        CARD_FACE_RADIUS_CLASS,
      )}
    >
      <Image src={src} alt={alt} fill className="object-cover" sizes={sizes} unoptimized />
      <CardFinishOverlay finish={finish} />
    </div>
  );
}

function withOptionalLink(href: string | null | undefined, node: ReactNode) {
  if (href) {
    return (
      <Link
        href={href}
        className="block w-full cursor-pointer transition-opacity hover:opacity-90"
      >
        {node}
      </Link>
    );
  }
  return node;
}

function withTilt(
  variant: "thumbnail" | "detail" | "grid",
  node: ReactNode,
): ReactNode {
  if (variant === "thumbnail") {
    return node;
  }
  return (
    <CardTilt intensity={variant === "detail" ? "detail" : "grid"} className="w-full">
      {node}
    </CardTilt>
  );
}

/**
 * Single-face image, or a staggered front/back stack for multiface cards.
 * The stacked variant keeps the same aspect box as single faces (bottom-aligned)
 * so grid footers stay level. Hovering the back raises it until hover leaves.
 * Detail/grid get CSS 3D pointer tilt; thumbnails stay flat.
 */
export function CardMultifaceImage({
  imageUri,
  faces,
  name,
  variant = "grid",
  href,
  finish = null,
}: CardMultifaceImageProps) {
  const uris = flipFaceUris(faces, imageUri);
  const stacked = canFlipFaces(faces) && variant !== "thumbnail";
  const [backRaised, setBackRaised] = useState(false);
  const sizes = variant === "detail" ? "300px" : "300px";

  if (uris.length === 0) {
    const placeholder = <CardFacePlaceholder variant={variant} label={name} />;
    return withOptionalLink(href, withTilt(variant, placeholder));
  }

  if (!stacked) {
    const image = (
      <CardImage
        src={uris[0]!}
        alt={faces?.[0]?.name ?? name}
        variant={variant}
        finish={finish}
      />
    );
    return withOptionalLink(href, withTilt(variant, image));
  }

  const frontUri = uris[0]!;
  const backUri = uris[1]!;
  const frontName = faces?.[0]?.name ?? name;
  const backName = faces?.[1]?.name ?? `${name} (back)`;

  const stack = (
    <div
      className={cn("relative w-full", CARD_FACE_ASPECT_CLASS)}
      aria-label={`${frontName} / ${backName}`}
    >
      {/* Same outer aspect as single faces; stack sits bottom-left so footers align. */}
      <div
        className="absolute bottom-0 left-0"
        style={{ width: STACK_WIDTH, height: STACK_HEIGHT }}
      >
        <div className="relative h-full w-full">
          <div
            className={cn(
              "absolute inset-0 transition-[z-index] duration-150",
              backRaised ? "z-20" : "z-0",
            )}
            style={{
              transform: `translate(${BACK_OFFSET_X}, ${BACK_OFFSET_Y})`,
            }}
            onMouseEnter={() => setBackRaised(true)}
            onMouseLeave={() => setBackRaised(false)}
          >
            <StackFace src={backUri} alt={backName} sizes={sizes} finish={finish} />
          </div>

          <div
            className={cn(
              "absolute inset-0 transition-[z-index] duration-150",
              backRaised ? "z-0" : "z-10",
            )}
          >
            <StackFace src={frontUri} alt={frontName} sizes={sizes} finish={finish} />
          </div>
        </div>
      </div>
    </div>
  );

  return withOptionalLink(href, withTilt(variant, stack));
}
