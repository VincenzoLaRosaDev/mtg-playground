"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

import { CardFacePlaceholder } from "@/components/discovery/card-image";
import type { CardFaceImage } from "@/lib/scryfall/faces";
import { CARD_FACE_ASPECT_CLASS, CARD_FACE_RADIUS_CLASS } from "@/lib/ui/card-face";
import { preloadImage } from "@/lib/ui/preload-image";
import { cn } from "@/lib/utils";

const OPEN_DELAY_MS = 150;
const PREVIEW_WIDTH_PX = 224; // 14rem
const VIEWPORT_PAD = 12;

function subscribeNever() {
  return () => {};
}

function useIsClient(): boolean {
  return useSyncExternalStore(subscribeNever, () => true, () => false);
}

type PreviewState = {
  src: string | null;
  name: string;
  top: number;
  left: number;
};

function canUseHoverPreview(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
}

function positionPreview(anchor: DOMRect): { top: number; left: number } {
  const vh = window.innerHeight;
  const vw = window.innerWidth;
  const height = PREVIEW_WIDTH_PX * (680 / 488);

  let left = anchor.right + VIEWPORT_PAD;
  if (left + PREVIEW_WIDTH_PX > vw - VIEWPORT_PAD) {
    left = anchor.left - PREVIEW_WIDTH_PX - VIEWPORT_PAD;
  }
  left = Math.max(VIEWPORT_PAD, Math.min(left, vw - PREVIEW_WIDTH_PX - VIEWPORT_PAD));

  let top = anchor.top;
  if (top + height > vh - VIEWPORT_PAD) {
    top = vh - height - VIEWPORT_PAD;
  }
  top = Math.max(VIEWPORT_PAD, top);

  return { top, left };
}

type CardHoverPreviewProps = {
  open: boolean;
  src: string | null;
  name: string;
  top: number;
  left: number;
};

/** Floating card art preview — desktop hover only; pointer-events none. */
export function CardHoverPreview({
  open,
  src,
  name,
  top,
  left,
}: CardHoverPreviewProps) {
  const isClient = useIsClient();
  if (!isClient || !open) return null;

  return createPortal(
    <div
      role="presentation"
      aria-hidden
      className="pointer-events-none fixed z-50 w-56"
      style={{ top, left }}
    >
      <div
        className={cn(
          "relative w-full overflow-hidden border border-border/60 bg-card shadow-lg",
          CARD_FACE_RADIUS_CLASS,
          CARD_FACE_ASPECT_CLASS,
        )}
      >
        {src ? (
          <Image
            src={src}
            alt=""
            fill
            sizes="224px"
            className="object-cover"
            unoptimized
          />
        ) : (
          <CardFacePlaceholder label={name} variant="grid" />
        )}
      </div>
    </div>,
    document.body,
  );
}

type CardNameWithHoverPreviewProps = {
  name: string;
  imageUri: string | null;
  faces?: CardFaceImage[] | null;
  onOpen: () => void;
  className?: string;
  children?: ReactNode;
};

/**
 * Clickable card name: hover shows art preview (fine pointer); click opens detail.
 */
export function CardNameWithHoverPreview({
  name,
  imageUri,
  faces,
  onOpen,
  className,
  children,
}: CardNameWithHoverPreviewProps) {
  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [preview, setPreview] = useState<PreviewState | null>(null);

  const clearTimer = useCallback(() => {
    if (openTimer.current) {
      clearTimeout(openTimer.current);
      openTimer.current = null;
    }
  }, []);

  const hide = useCallback(() => {
    clearTimer();
    setPreview(null);
  }, [clearTimer]);

  useEffect(() => () => clearTimer(), [clearTimer]);

  const src = faces?.[0]?.imageUri ?? imageUri;

  return (
    <>
      <button
        type="button"
        className={cn(
          "min-w-0 truncate text-left text-sm text-info-foreground underline-offset-2 hover:underline",
          className,
        )}
        onClick={onOpen}
        onMouseEnter={(event) => {
          if (!canUseHoverPreview()) return;
          clearTimer();
          const rect = event.currentTarget.getBoundingClientRect();
          preloadImage(src);
          openTimer.current = setTimeout(() => {
            const pos = positionPreview(rect);
            setPreview({ src, name, ...pos });
          }, OPEN_DELAY_MS);
        }}
        onMouseLeave={hide}
        onFocus={hide}
      >
        {children ?? name}
      </button>
      <CardHoverPreview
        open={preview != null}
        src={preview?.src ?? null}
        name={preview?.name ?? name}
        top={preview?.top ?? 0}
        left={preview?.left ?? 0}
      />
    </>
  );
}
