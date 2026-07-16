/** Shared site width + horizontal padding for header, footer, and page content. */
export const SITE_MAX_WIDTH_CLASS = "max-w-7xl";
export const SITE_GUTTER_CLASS = "px-6";

export const siteContainerClassName = `mx-auto w-full ${SITE_MAX_WIDTH_CLASS} ${SITE_GUTTER_CLASS}`;

/** CSS custom property set by AppHeader via ResizeObserver (includes mobile stacked search). */
export const SITE_HEADER_HEIGHT_VAR = "--site-header-height";

/** Sticky offset just below the site header (`--site-header-height` set in globals + AppHeader). */
export const SITE_STICKY_BELOW_HEADER_CLASS = "top-[var(--site-header-height)]";

/**
 * Detail hero image column width — keep these class strings literal for Tailwind scan.
 * Change both together if the image column width changes.
 */
export const CARD_DETAIL_IMAGE_MAX_CLASS = "max-w-[300px]";

/** Two-column detail layout: fixed image sidebar + fluid main column. */
export const DETAIL_HERO_GRID_CLASS =
  "grid gap-8 lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-10";

export const DETAIL_MAIN_COLUMN_CLASS = "min-w-0 space-y-5";

/** Sticky section jump under the site header (mobile detail). */
export const DETAIL_SECTION_JUMP_STICKY_CLASS = `sticky ${SITE_STICKY_BELOW_HEADER_CLASS} z-30 -mx-1 border-b border-border/80 bg-background/95 px-1 py-2 backdrop-blur-md lg:hidden`;

/** Desktop section TOC — sticks below header; -1px tucks `border-t` under the header edge. */
export const DETAIL_SECTION_NAV_STICKY_CLASS =
  "sticky top-[calc(var(--site-header-height)-1px)] z-20 hidden max-h-[calc(100dvh-var(--site-header-height)-1rem)] min-h-0 flex-col border-t border-border bg-background/95 pt-4 backdrop-blur-md lg:flex";
