import { cn } from "@/lib/utils";

export const browseFilterLabelClassName =
  "mb-1 block text-xs font-medium leading-none text-muted-foreground";

/** Shared field chrome for browse toolbars (native inputs + selects). */
export const browseToolbarInputClassName =
  "h-8 w-full min-w-0 rounded-md border border-input bg-background px-2.5 text-sm shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

/** CMC min/max — two-digit numbers, fixed narrow width. */
export const browseToolbarCmcFieldClassName = "w-[4.25rem] shrink-0";

export const browseToolbarCmcInputClassName = cn(
  browseToolbarInputClassName,
  "px-1.5 text-center tabular-nums",
);

export const browseToolbarPanelClassName = "space-y-3";

/** Set browse — wide search + sort / set type / digital. */
export const browseToolbarDenseGridClassName =
  "grid grid-cols-1 gap-x-3 gap-y-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,2.5fr)_repeat(3,minmax(0,1fr))]";

/** Set detail — wide search + sort + type + compact CMC fields. */
export const browseToolbarSetDetailGridClassName =
  "grid grid-cols-1 gap-x-3 gap-y-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,2.25fr)_minmax(0,1fr)_minmax(0,1.1fr)_auto_auto]";

/** Card / commander / catalog — wide search + sort + type + compact CMC fields. */
export const browseToolbarListGridClassName =
  "grid grid-cols-1 gap-x-3 gap-y-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1.15fr)_auto_auto] xl:grid-cols-[minmax(0,2.25fr)_minmax(0,1fr)_minmax(0,1.2fr)_auto_auto]";

export const browseToolbarPillGroupsClassName =
  "grid gap-3 sm:grid-cols-2 xl:grid-cols-4";
