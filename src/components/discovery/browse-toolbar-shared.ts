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
 * Default pill groups (color / rarity / options): 1 → 2 → 3 cols.
 * Prefer hub-specific class when Options needs extra width.
 */
export const browseToolbarPillGroupsClassName =
  "grid gap-3 sm:grid-cols-2 lg:grid-cols-3";

/**
 * Browse hub pills: Color + Rarity hug content; Options takes remaining space
 * so Commander / Game Changer / Reserved stay on one line at lg+.
 */
export const browseToolbarHubPillGroupsClassName =
  "grid gap-3 sm:grid-cols-2 lg:grid-cols-[auto_auto_minmax(12rem,1fr)]";

/** Commander detail — Theme / Budget / Bracket, equal columns from sm. */
export const browseToolbarCommanderDetailGridClassName =
  "grid grid-cols-1 gap-x-3 gap-y-3 sm:grid-cols-3";
