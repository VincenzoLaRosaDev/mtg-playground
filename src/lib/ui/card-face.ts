/** Proportional corner radius matching MTG card art (~4.5% of width). */
export const CARD_FACE_RADIUS_CLASS = "rounded-[4.5%]";

export const CARD_FACE_ASPECT_CLASS = "aspect-[488/680]";

export function cardFacePlaceholderClassName(variant: "thumbnail" | "detail" | "grid" = "thumbnail") {
  const size =
    variant === "thumbnail"
      ? "h-[62px] w-[44px]"
      : "aspect-[488/680] w-full";

  return `flex shrink-0 items-center justify-center bg-muted text-muted-foreground ${CARD_FACE_RADIUS_CLASS} ${size}`;
}

/** Browse listing grids (cards, commanders, catalog, set detail). */
export const CARD_FACE_GRID_CLASS =
  "grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 3xl:grid-cols-7!";

/**
 * Card/commander detail section grids (slightly roomier than browse).
 * Use beside sticky `DetailSectionNav` (`lg+`).
 */
export const CARD_FACE_DETAIL_GRID_CLASS =
  "grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6!";

/**
 * Same as `CARD_FACE_DETAIL_GRID_CLASS` but +1 column from `lg` up — when the
 * lists band has no lateral TOC and would otherwise stretch tiles too wide.
 */
export const CARD_FACE_DETAIL_GRID_WIDE_CLASS =
  "grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 3xl:grid-cols-7!";

export function cardFaceDetailGridClass(wide = false): string {
  return wide ? CARD_FACE_DETAIL_GRID_WIDE_CLASS : CARD_FACE_DETAIL_GRID_CLASS;
}

/** Sets browse — horizontal card rows in a wide multi-column grid. */
export const SET_BROWSE_GRID_CLASS =
  "grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4";

/** Grid tile footer — rank / stats / salt on one row, spaced apart. */
export const CARD_FACE_TILE_FOOTER_CLASS =
  "mt-2 flex w-full min-w-0 flex-nowrap items-center justify-between gap-2";

/**
 * Clickable printing / version tile frame (collection add, versions browser).
 * Cursor comes from base `button:enabled`; keep focus-ring language shared.
 */
export const CARD_PRINTING_TILE_BUTTON_CLASS =
  "w-full cursor-pointer rounded-lg border border-transparent p-2 text-left transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export const CARD_PRINTING_TILE_SELECTED_CLASS = "border-ring ring-3 ring-ring/50";
