/** Scroll margin so anchored sections clear sticky header + section jump/nav. */
export const DETAIL_SECTION_SCROLL_MARGIN =
  "scroll-mt-[calc(var(--site-header-height)+3.5rem)]";

export const DETAIL_SECTION_HEADING_CLASS =
  "text-sm font-semibold uppercase tracking-wide text-muted-foreground";

/** Same surface as browse filter panels (`bg-card`). */
export const DETAIL_SECTION_PANEL_CLASS =
  "rounded-lg border border-border bg-card p-5 shadow-sm";

/** @deprecated Use DETAIL_SECTION_PANEL_CLASS — unique tint removed for visual alignment. */
export const DETAIL_SECTION_UNIQUE_PANEL_CLASS = DETAIL_SECTION_PANEL_CLASS;

/** @deprecated Unique nav tint removed — kept so call sites compile until cleaned. */
export const DETAIL_SECTION_UNIQUE_NAV_CLASS = "";

/** @deprecated Use plain spacing wrappers without primary tint. */
export const DETAIL_SECTION_UNIQUE_WRAP_CLASS = "rounded-lg p-3";

export function detailSectionPanelClass(_uniqueToView = false): string {
  return DETAIL_SECTION_PANEL_CLASS;
}

export const DETAIL_SECTION_IDS = {
  relativesBySubtype: "relatives-by-subtype",
  similarCards: "similar-cards",
  roleStaples: "role-staples",
  gameChangers: "game-changers",
  buildSkeleton: "build-skeleton",
} as const;

export function roleStapleSectionId(role: string): string {
  return `${DETAIL_SECTION_IDS.roleStaples}-${role}`;
}

/** First letter uppercase for nav/section labels (e.g. "removal hard" → "Removal hard"). */
export function capitalizeLabel(label: string): string {
  if (!label) return label;
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export type DetailSectionNavItem = {
  id: string;
  label: string;
  /** Kept for API compatibility; no longer styles nav items. */
  uniqueToView?: boolean;
};

export function buildCardDetailNavItems(input: {
  hasSimilarCards?: boolean;
  hasRelatives: boolean;
}): DetailSectionNavItem[] {
  const items: DetailSectionNavItem[] = [];

  if (input.hasSimilarCards) {
    items.push({ id: DETAIL_SECTION_IDS.similarCards, label: "Similar cards" });
  }
  if (input.hasRelatives) {
    items.push({
      id: DETAIL_SECTION_IDS.relativesBySubtype,
      label: "Relatives by subtype",
    });
  }

  return items;
}

export function buildCommanderDetailNavItems(input: {
  roleStaples?: Array<{ role: string; label: string }>;
  hasGameChangers?: boolean;
  hasBuildSkeleton?: boolean;
}): DetailSectionNavItem[] {
  const items: DetailSectionNavItem[] = [];

  for (const group of input.roleStaples ?? []) {
    items.push({
      id: roleStapleSectionId(group.role),
      label: capitalizeLabel(group.label),
    });
  }
  if (input.hasGameChangers) {
    items.push({ id: DETAIL_SECTION_IDS.gameChangers, label: "Game Changers" });
  }
  if (input.hasBuildSkeleton) {
    items.push({ id: DETAIL_SECTION_IDS.buildSkeleton, label: "Build skeleton" });
  }

  return items;
}
