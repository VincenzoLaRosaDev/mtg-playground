/** Shared site width + horizontal padding for header, footer, and page content. */
export const SITE_MAX_WIDTH_CLASS = "max-w-7xl";
export const SITE_GUTTER_CLASS = "px-6";

export const siteContainerClassName = `mx-auto w-full ${SITE_MAX_WIDTH_CLASS} ${SITE_GUTTER_CLASS}`;

/** Detail hero card image column (card + commander pages). */
export const CARD_DETAIL_IMAGE_MAX_CLASS = "max-w-[300px]";

/** Two-column detail layout: fixed image sidebar + fluid main column. */
export const DETAIL_HERO_GRID_CLASS =
  "grid gap-8 lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-10";

export const DETAIL_MAIN_COLUMN_CLASS = "min-w-0 space-y-5";
