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
 * Set detail — search · sort · type · CMC pair.
 * sm: 2×2; lg+: one row with CMC pair sized to content.
 */
export const browseToolbarSetDetailGridClassName =
  "grid grid-cols-1 gap-x-3 gap-y-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,2.25fr)_minmax(0,1fr)_minmax(0,1.25fr)_auto]";

/**
 * Card / commander / catalog list — search · sort · type · CMC pair.
 * 1 → 2×2 (sm) → one balanced row (lg+); search stays widest.
 */
export const browseToolbarListGridClassName =
  "grid grid-cols-1 gap-x-3 gap-y-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)_minmax(0,1.35fr)_auto] xl:grid-cols-[minmax(0,2.5fr)_minmax(0,1.05fr)_minmax(0,1.4fr)_auto]";

/** Commander detail — Theme / Budget / Bracket, equal columns from sm. */
export const browseToolbarCommanderDetailGridClassName =
  "grid grid-cols-1 gap-x-3 gap-y-3 sm:grid-cols-3";

export const browseToolbarPillGroupsClassName =
  "grid gap-3 sm:grid-cols-2 xl:grid-cols-4";
