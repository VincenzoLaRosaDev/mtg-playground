export const BROWSE_COLOR_OPTIONS = [
  { value: "", label: "Any color" },
  { value: "W", label: "White" },
  { value: "U", label: "Blue" },
  { value: "B", label: "Black" },
  { value: "R", label: "Red" },
  { value: "G", label: "Green" },
  { value: "C", label: "Colorless" },
] as const;

export const browseToolbarInputClassName =
  "rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950";

export const browseToolbarPanelClassName =
  "space-y-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/40";
