/** Shared site width + horizontal padding for header, footer, and page content. */
export const SITE_MAX_WIDTH_CLASS = "max-w-8xl";
export const SITE_GUTTER_CLASS = "px-6";

export const siteContainerClassName = `mx-auto w-full ${SITE_MAX_WIDTH_CLASS} ${SITE_GUTTER_CLASS}`;

/**
 * Cancel `SITE_GUTTER_CLASS` so a `border-b` / `border-t` matches the outer
 * edges of a `siteContainerClassName` ancestor (same width as headers that put
 * the border on the container itself).
 */
export const SITE_GUTTER_BLEED_X_CLASS = "-mx-6 px-6";

/** Hairline under sheet chrome / above list bodies. */
export const SHEET_LIST_RULE_CLASS = "border-b border-border";

/** CSS custom property set by AppHeader via ResizeObserver (includes mobile stacked search). */
export const SITE_HEADER_HEIGHT_VAR = "--site-header-height";

/**
 * Portal target under the measured nav, inside the sticky header wrapper.
 * List filter tongue/drawer mounts here so overscroll bounce keeps them attached.
 */
export const SITE_HEADER_CHROME_SLOT_ID = "site-header-chrome";

/** Measured nav element inside the sticky header wrapper (`AppHeader`). */
export const SITE_HEADER_NAV_ID = "site-header-nav";

/** Sticky offset just below the site header (`--site-header-height` set in globals + AppHeader). */
export const SITE_STICKY_BELOW_HEADER_CLASS = "top-[var(--site-header-height)]";

/**
 * Card detail PDP hero — full-width image stacked under `sm`;
 * 300px image | meta from `sm` (same breakpoint as the modal, larger column).
 */
export const CARD_DETAIL_IMAGE_COLUMN_CLASS =
  "relative mx-auto w-full shrink-0 sm:mx-0 sm:w-[300px]";

/** Two-column PDP hero: 300px image sidebar + fluid main column (from `sm`). */
export const DETAIL_HERO_GRID_CLASS =
  "grid gap-6 sm:grid-cols-[300px_minmax(0,1fr)] sm:items-start sm:gap-8";

/**
 * Card detail modal hero — same `sm` stack/split as the PDP, narrower 16rem column.
 */
export const CARD_DETAIL_MODAL_IMAGE_COLUMN_CLASS =
  "relative mx-auto w-full shrink-0 sm:mx-0 sm:max-w-[16rem]";

export const CARD_DETAIL_MODAL_HERO_GRID_CLASS =
  "grid gap-6 sm:grid-cols-[minmax(0,16rem)_minmax(0,1fr)] sm:items-start sm:gap-8";

/** Fluid detail hero column (no max-width — constrain controls locally). */
export const DETAIL_MAIN_COLUMN_CLASS = "min-w-0";

/** Overview details panel — stacked groups that fill the fluid column. */
export const DETAIL_OVERVIEW_PANEL_CLASS = "flex min-w-0 flex-col gap-5";

/**
 * Printing section (PDP + modal) — same 3-col track as Status|Roles|Themes:
 * stack under `lg`; from `lg` Version spans 2 / Finish 1.
 * When Finish is absent, Version uses the capped group (no full-bleed select).
 */
export const DETAIL_PRINTING_CONTROLS_CLASS =
  "grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6";

/** Version column — 2/3 from `lg`. */
export const DETAIL_PRINTING_VERSION_COL_CLASS = "min-w-0 lg:col-span-2";

/** Finish column — 1/3 from `lg`. */
export const DETAIL_PRINTING_FINISH_COL_CLASS = "min-w-0 lg:col-span-1";

/**
 * Cap for Version select (+ Show all pair) so a missing Finish doesn’t stretch
 * the control across the whole overview column.
 */
export const DETAIL_VERSION_SELECT_MAX_W_CLASS = "max-w-md";

/**
 * Version select + Show all versions: flex wrap so they sit side-by-side when
 * space allows and stack when the pair runs out of room.
 */
export const DETAIL_PRINTING_VERSION_GROUP_CLASS =
  `flex min-w-0 w-full flex-wrap items-end gap-2 ${DETAIL_VERSION_SELECT_MAX_W_CLASS}`;

/** @deprecated Use DETAIL_PRINTING_CONTROLS_CLASS. */
export const DETAIL_PRINTING_VERSION_ROW_CLASS = DETAIL_PRINTING_CONTROLS_CLASS;

/** @deprecated Use DETAIL_PRINTING_CONTROLS_CLASS. */
export const DETAIL_OVERVIEW_CONTROLS_GRID_CLASS = DETAIL_PRINTING_CONTROLS_CLASS;

/** Version select inside the version group — shares the wrap row with Show all. */
export const DETAIL_VERSION_SELECT_CLASS =
  `min-w-0 w-full max-w-full flex-1 basis-[min(100%,12rem)]`;

/** Finish toggle — fills its grid column. */
export const DETAIL_FINISH_TOGGLE_CLASS = "w-full min-w-0";

/** Show all versions trigger — match SelectTrigger `h-8` (Button default). */
export const DETAIL_SHOW_ALL_VERSIONS_BUTTON_CLASS =
  "h-8 w-full shrink-0 sm:w-auto";

/** Lists band: sticky TOC + sections (desktop). */
export const DETAIL_LISTS_GRID_CLASS =
  "grid gap-6 lg:grid-cols-[minmax(10rem,14rem)_minmax(0,1fr)] lg:gap-8";

/** As card / As commander — outline toggles (same language as Finish), larger hit targets. */
export const DETAIL_VIEW_TOGGLE_CLASS =
  "flex w-full justify-start sm:w-fit";

/** Sticky section jump under the site header (mobile detail). */
export const DETAIL_SECTION_JUMP_STICKY_CLASS = `sticky ${SITE_STICKY_BELOW_HEADER_CLASS} z-30 -mx-1 border-b border-border/80 bg-background/95 px-1 py-2 backdrop-blur-md lg:hidden`;

/** Desktop section TOC — sticks below header; -1px tucks `border-t` under the header edge. */
export const DETAIL_SECTION_NAV_STICKY_CLASS =
  "sticky top-[calc(var(--site-header-height)-1px)] z-20 hidden max-h-[calc(100dvh-var(--site-header-height)-1rem)] min-h-0 flex-col border-t border-border bg-background/95 pt-4 backdrop-blur-md lg:flex";

/**
 * Reserve sheet height while card-detail / versions / workspace-search load
 * so `h-fit` dialogs don’t jump from short → tall.
 */
export const SHEET_CARD_DETAIL_LOADING_MIN_H_CLASS =
  "min-h-[min(85dvh,36rem)]";

/** Scroll body footprint for VersionsBrowser / workspace search result grids. */
export const SHEET_CARD_GRID_BODY_MIN_H_CLASS = "min-h-[min(50dvh,28rem)]";

/**
 * Soft reveal for level-B content (streamed lists, variable bands).
 * Prefer this over inventing height for unpredictable payloads.
 */
export const CONTENT_REVEAL_CLASS =
  "animate-in fade-in-0 duration-200 motion-reduce:animate-none";
