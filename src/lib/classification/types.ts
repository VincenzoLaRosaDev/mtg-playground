/** Functional roles counted in Phase 3.1 meta comparison. */
export const FUNCTIONAL_ROLES = [
  "removal_hard",
  "removal_soft",
  "ramp",
  "draw",
  "counter",
  "discard",
] as const;

export type FunctionalRole = (typeof FUNCTIONAL_ROLES)[number];

/** High-confidence synergy themes (Phase 3.2). */
export const SYNERGY_THEMES = [
  "sacrifice_aristocrats",
  "graveyard_recursion",
  "tokens",
  "plus_one_counters",
  "spells_matter",
  "discard_madness",
  "life_gain_drain",
  "equipment_voltron",
  "landfall",
  "artifacts_matter",
  "blink_flicker",
  "burn",
  "tribal",
  "mill",
] as const;

export type SynergyTheme = (typeof SYNERGY_THEMES)[number];

export type CardOverrideEntry = {
  oracle_id: string;
  roles?: FunctionalRole[];
  themes?: SynergyTheme[];
  note?: string;
};

export type CardOverridesFile = {
  version: 1;
  entries: CardOverrideEntry[];
};

export type ClassificationResult = {
  roles: FunctionalRole[];
  themes: SynergyTheme[];
  tagSlugs: string[];
};

export function isFunctionalRole(value: string): value is FunctionalRole {
  return (FUNCTIONAL_ROLES as readonly string[]).includes(value);
}

export function isSynergyTheme(value: string): value is SynergyTheme {
  return (SYNERGY_THEMES as readonly string[]).includes(value);
}

export function uniqueSorted<T extends string>(values: Iterable<T>): T[] {
  return [...new Set(values)].sort();
}
