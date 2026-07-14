import { CARD_DETAIL_IMAGE_MAX_CLASS } from "@/lib/ui/layout";

/** Proportional corner radius matching MTG card art (~4.5% of width). */
export const CARD_FACE_RADIUS_CLASS = "rounded-[4.5%]";

export const CARD_FACE_ASPECT_CLASS = "aspect-[488/680]";

export function cardFacePlaceholderClassName(variant: "thumbnail" | "detail" | "grid" = "thumbnail") {
  const size =
    variant === "thumbnail"
      ? "h-[62px] w-[44px]"
      : variant === "detail"
        ? `aspect-[488/680] w-full ${CARD_DETAIL_IMAGE_MAX_CLASS}`
        : "aspect-[488/680] w-full";

  return `flex shrink-0 items-center justify-center bg-muted text-muted-foreground ${CARD_FACE_RADIUS_CLASS} ${size}`;
}

export const CARD_FACE_GRID_CLASS =
  "grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6";

/** Sets browse — horizontal card rows in a wide multi-column grid. */
export const SET_BROWSE_GRID_CLASS =
  "grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3";

/** Grid tile footer — rank / stats / salt on one row, spaced apart. */
export const CARD_FACE_TILE_FOOTER_CLASS =
  "mt-2 flex w-full min-w-0 flex-nowrap items-center justify-between gap-2";
