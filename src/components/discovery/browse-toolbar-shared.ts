export const browseFilterLabelClassName =
  "mb-1 block text-xs font-medium leading-none text-muted-foreground";

/** CMC min/max — two-digit numbers, fixed narrow width. */
export const browseToolbarCmcFieldClassName = "w-[4.5rem] shrink-0";

/** Paired CMC min + max as one grid cell (keeps sm/lg rows balanced). */
export const browseToolbarCmcPairClassName = "flex shrink-0 items-end gap-2";

export const browseToolbarPanelClassName = "space-y-3";

/** Set browse — wide search + sort / set type / digital. */
export const browseToolbarDenseGridClassName =
  "grid grid-cols-1 gap-x-3 gap-y-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,2.5fr)_repeat(3,minmax(0,1fr))]";

/**
 * Set detail — search · sort · type · CMC pair · format.
 * sm: 2 cols; lg+: search+sort+type+cmc+format.
 */
export const browseToolbarSetDetailGridClassName =
  "grid grid-cols-1 gap-x-3 gap-y-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1.15fr)_auto_minmax(0,1.1fr)]";

/**
 * Collection — search · sort · set · type · CMC pair · format.
 * sm: 2 cols; lg+: six tracks (CMC stays content-sized).
 */
export const browseToolbarCollectionGridClassName =
  "grid grid-cols-1 gap-x-3 gap-y-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,0.85fr)_minmax(0,1.1fr)_auto_minmax(0,1fr)]";

/**
 * Legacy list toolbars (search · sort · type · CMC) — 1 → 2×2 (sm) → one row (lg+).
 */
export const browseToolbarListGridClassName =
  "grid grid-cols-1 gap-x-3 gap-y-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)_minmax(0,1.35fr)_auto] xl:grid-cols-[minmax(0,2.5fr)_minmax(0,1.05fr)_minmax(0,1.4fr)_auto]";

/**
 * Browse hub — row 1: search · sort · type · CMC.
 * Search widest; CMC stays content-sized.
 */
export const browseToolbarHubPrimaryGridClassName =
  "grid grid-cols-1 gap-x-3 gap-y-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,2.4fr)_minmax(0,1.1fr)_minmax(0,1.25fr)_auto]";

/**
 * Browse hub — row 2: Role · Theme · Format (equal weight).
 */
export const browseToolbarHubSecondaryGridClassName =
  "grid grid-cols-1 gap-x-3 gap-y-3 sm:grid-cols-3";

/**
 * Color / Rarity / Finish / Options pill groups — hug content with the same
 * `gap-3` as field grids (site-wide: hub, cards, set detail, collection).
 */
export const browseToolbarPillGroupsClassName =
  "flex flex-wrap items-start gap-x-3 gap-y-3";

/** Commander detail — Theme / Budget / Bracket, equal columns from sm. */
export const browseToolbarCommanderDetailGridClassName =
  "grid grid-cols-1 gap-x-3 gap-y-3 sm:grid-cols-3";
