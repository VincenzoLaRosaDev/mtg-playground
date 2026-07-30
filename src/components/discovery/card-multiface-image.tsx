"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type ReactNode } from "react";

import {
  CardFacePlaceholder,
  CardFinishOverlay,
  CardImage,
  glareMotionForVariant,
} from "@/components/discovery/card-image";
import { CardTilt } from "@/components/discovery/card-tilt";
import type { PrintingFinish } from "@/lib/scryfall/card-printing";
import { canFlipFaces, flipFaceUris, type CardFaceImage } from "@/lib/scryfall/faces";
import { CARD_FACE_ASPECT_CLASS, CARD_FACE_RADIUS_CLASS } from "@/lib/ui/card-face";
import {
  NAV_PROGRESS_SKIP_ATTR,
  NAV_PROGRESS_SKIP_VALUE,
} from "@/lib/ui/navigation-progress";
import { cn } from "@/lib/utils";

type CardMultifaceImageProps = {
  imageUri?: string | null;
  faces?: CardFaceImage[] | null;
  name: string;
  variant?: "thumbnail" | "detail" | "grid";
  /** When set, the stack links to this href. */
  href?: string | null;
  /**
   * Primary click opens in-app overlay (e.g. card detail modal).
   * Middle-click / cmd-click / open-in-new-tab still follow `href`.
   */
  onOpen?: () => void;
  finish?: PrintingFinish | null;
  /** LCP / hero front face — eager fetch. */
  priority?: boolean;
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
  glareMotion,
  priority = false,
  /** Prefer lazy fetch for the offset back face (front stays LCP/priority). */
  lazy = false,
}: {
  src: string;
  alt: string;
  sizes: string;
  finish?: PrintingFinish | null;
  glareMotion: ReturnType<typeof glareMotionForVariant>;
  priority?: boolean;
  lazy?: boolean;
}) {
  const [loaded, setLoaded] = useState(false);
  const [loadedSrc, setLoadedSrc] = useState(src);
  if (src !== loadedSrc) {
    setLoadedSrc(src);
    setLoaded(false);
  }

  return (
    <div
      className={cn(
        "group/finish relative h-full w-full overflow-hidden shadow-md ring-1 ring-black/25",
        CARD_FACE_RADIUS_CLASS,
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
        sizes={sizes}
        priority={priority}
        fetchPriority={priority ? "high" : undefined}
        loading={lazy && !priority ? "lazy" : undefined}
        unoptimized
        onLoad={() => setLoaded(true)}
      />
      {loaded ? <CardFinishOverlay finish={finish} glareMotion={glareMotion} /> : null}
    </div>
  );
}

function withOptionalLink(
  href: string | null | undefined,
  node: ReactNode,
  onOpen?: () => void,
) {
  if (href) {
    return (
      <Link
        href={href}
        className="block w-full cursor-pointer transition-opacity hover:opacity-90"
        {...(onOpen
          ? {
              [NAV_PROGRESS_SKIP_ATTR]: NAV_PROGRESS_SKIP_VALUE,
            }
          : null)}
        onClick={(event) => {
          if (!onOpen) return;
          // Keep middle-click / modified clicks as real navigation to the PDP.
          if (
            event.metaKey ||
            event.ctrlKey ||
            event.shiftKey ||
            event.altKey ||
            event.button !== 0
          ) {
            return;
          }
          event.preventDefault();
          onOpen();
        }}
      >
        {node}
      </Link>
    );
  }
  if (onOpen) {
    return (
      <button
        type="button"
        className="block w-full cursor-pointer text-left transition-opacity hover:opacity-90"
        onClick={onOpen}
      >
        {node}
      </button>
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
  onOpen,
  finish = null,
  priority = false,
}: CardMultifaceImageProps) {
  const uris = flipFaceUris(faces, imageUri);
  const stacked = canFlipFaces(faces) && variant !== "thumbnail";
  const [backRaised, setBackRaised] = useState(false);
  const sizes =
    variant === "detail"
      ? "(max-width: 639px) 100vw, 300px"
      : variant === "grid"
        ? "(max-width: 639px) 16rem, 16rem"
        : "300px";
  const glareMotion = glareMotionForVariant(variant);

  if (uris.length === 0) {
    const placeholder = <CardFacePlaceholder variant={variant} label={name} />;
    return withOptionalLink(href, withTilt(variant, placeholder), onOpen);
  }

  if (!stacked) {
    const image = (
      <CardImage
        src={uris[0]!}
        alt={faces?.[0]?.name ?? name}
        variant={variant}
        finish={finish}
        priority={priority}
      />
    );
    return withOptionalLink(href, withTilt(variant, image), onOpen);
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
            <StackFace
              src={backUri}
              alt={backName}
              sizes={sizes}
              finish={finish}
              glareMotion={glareMotion}
              lazy
            />
          </div>

          <div
            className={cn(
              "absolute inset-0 transition-[z-index] duration-150",
              backRaised ? "z-0" : "z-10",
            )}
          >
            <StackFace
              src={frontUri}
              alt={frontName}
              sizes={sizes}
              finish={finish}
              glareMotion={glareMotion}
              priority={priority}
            />
          </div>
        </div>
      </div>
    </div>
  );

  return withOptionalLink(href, withTilt(variant, stack), onOpen);
}
