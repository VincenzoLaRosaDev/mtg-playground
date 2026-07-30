/**
 * Accent chrome: primary (brand) and info (wish / teal).
 *
 * - **Action (primary)** — submit / important buttons: full border + full fill.
 * - **Label** — chips, selected tabs/filters: full border + translucent fill.
 * - **Info / wish buttons** — same soft label chrome (teal is too light for solid fills).
 */

export const ACTION_PRIMARY_CLASS =
  "border border-primary bg-primary text-primary-foreground hover:border-primary/80 hover:bg-primary/80";

/** Wish / info CTAs — label opacity style (not solid fill). */
export const ACTION_INFO_CLASS =
  "border border-info bg-info/15 text-info-foreground hover:bg-info/25";

export const LABEL_PRIMARY_CLASS =
  "border border-primary bg-primary/15 text-primary";

export const LABEL_INFO_CLASS =
  "border border-info bg-info/15 text-info-foreground";

/** Neutral status (e.g. generic muted chips). */
export const LABEL_MUTED_CLASS =
  "border border-border bg-muted/50 text-muted-foreground";

/** Deck row fully owned (matches modal / PDP “In this deck” Owned chip). */
export const LABEL_OWNED_CLASS =
  "border border-emerald-600/40 bg-emerald-500/15 text-emerald-800 dark:text-emerald-300";

/** Deck row still missing copies from collection. */
export const LABEL_MISSING_CLASS =
  "border border-warning bg-warning/15 text-warning-foreground";

/** Chip / badge footprint shared by Owned · Wish · qty pills. */
export const STATUS_CHIP_CLASS =
  "inline-flex h-5 items-center rounded-md px-1.5 text-[10px] font-semibold leading-none tracking-wide uppercase";

/** Outline toggle pressed → primary label chrome (not solid primary). */
export const SELECTION_TOGGLE_PRESSED_CLASS =
  "data-pressed:border-primary data-pressed:bg-primary/15 data-pressed:text-primary data-pressed:hover:bg-primary/25 aria-pressed:border-primary aria-pressed:bg-primary/15 aria-pressed:text-primary";
