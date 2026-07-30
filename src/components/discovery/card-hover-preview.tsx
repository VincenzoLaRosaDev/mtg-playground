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
const PREVIEW_HEIGHT_PX = PREVIEW_WIDTH_PX * (680 / 488);
const VIEWPORT_PAD = 12;
/** Offset from the cursor so the card isn’t under the pointer. */
const CURSOR_OFFSET_X = 16;
const CURSOR_OFFSET_Y = 16;

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

/** Place the preview near the pointer, flipping when it would leave the viewport. */
function positionPreviewAtCursor(
  clientX: number,
  clientY: number,
): { top: number; left: number } {
  const vh = window.innerHeight;
  const vw = window.innerWidth;

  let left = clientX + CURSOR_OFFSET_X;
  if (left + PREVIEW_WIDTH_PX > vw - VIEWPORT_PAD) {
    left = clientX - PREVIEW_WIDTH_PX - CURSOR_OFFSET_X;
  }
  left = Math.max(
    VIEWPORT_PAD,
    Math.min(left, vw - PREVIEW_WIDTH_PX - VIEWPORT_PAD),
  );

  let top = clientY + CURSOR_OFFSET_Y;
  if (top + PREVIEW_HEIGHT_PX > vh - VIEWPORT_PAD) {
    top = clientY - PREVIEW_HEIGHT_PX - CURSOR_OFFSET_Y;
  }
  top = Math.max(
    VIEWPORT_PAD,
    Math.min(top, vh - PREVIEW_HEIGHT_PX - VIEWPORT_PAD),
  );

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
  const rafRef = useRef<number | null>(null);
  const pointerRef = useRef({ x: 0, y: 0 });
  const openRef = useRef(false);
  const [preview, setPreview] = useState<PreviewState | null>(null);

  const clearTimer = useCallback(() => {
    if (openTimer.current) {
      clearTimeout(openTimer.current);
      openTimer.current = null;
    }
  }, []);

  const cancelRaf = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const hide = useCallback(() => {
    clearTimer();
    cancelRaf();
    openRef.current = false;
    setPreview(null);
  }, [cancelRaf, clearTimer]);

  const scheduleMove = useCallback(() => {
    if (!openRef.current || rafRef.current != null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      if (!openRef.current) return;
      const { x, y } = pointerRef.current;
      const pos = positionPreviewAtCursor(x, y);
      setPreview((prev) =>
        prev ? { ...prev, ...pos } : prev,
      );
    });
  }, []);

  useEffect(
    () => () => {
      clearTimer();
      cancelRaf();
    },
    [cancelRaf, clearTimer],
  );

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
          pointerRef.current = { x: event.clientX, y: event.clientY };
          preloadImage(src);
          openTimer.current = setTimeout(() => {
            const { x, y } = pointerRef.current;
            openRef.current = true;
            setPreview({ src, name, ...positionPreviewAtCursor(x, y) });
          }, OPEN_DELAY_MS);
        }}
        onMouseMove={(event) => {
          if (!canUseHoverPreview()) return;
          pointerRef.current = { x: event.clientX, y: event.clientY };
          scheduleMove();
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
