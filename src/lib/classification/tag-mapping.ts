import type { FunctionalRole, SynergyTheme } from "@/lib/classification/types";
import { uniqueSorted } from "@/lib/classification/types";

const ROLE_MAP: Record<string, FunctionalRole> = {
  // Removal — hard
  removal: "removal_hard",
  "removal-destroy": "removal_hard",
  "removal-exile": "removal_hard",
  "removal-creature": "removal_hard",
  "removal-permanent": "removal_hard",
  "removal-noncreature": "removal_hard",
  "removal-enchantment": "removal_hard",
  "removal-artifact": "removal_hard",
  "removal-planeswalker": "removal_hard",
  "removal-land": "removal_hard",
  "removal-battle": "removal_hard",
  "removal-spacecraft": "removal_hard",
  "removal-burn": "removal_hard",
  "multi-removal": "removal_hard",
  "creature-removal": "removal_hard",
  banish: "removal_hard",
  "banish-spell": "removal_hard",

  // Removal — soft
  "removal-bounce": "removal_soft",
  "removal-fight": "removal_soft",
  bounce: "removal_soft",
  "bounce-self": "removal_soft",
  fight: "removal_soft",
  "one-sided-fight": "removal_soft",
  "mass-fight": "removal_soft",
  "synergy-fight": "removal_soft",

  // Ramp
  ramp: "ramp",
  "land-ramp": "ramp",
  "multi-land-ramp": "ramp",
  "mana-dork": "ramp",
  "mana-producer": "ramp",
  "mana-egg": "ramp",
  "combat-ramp": "ramp",
  "tutor-land": "ramp",
  "tutor-land-to-battlefield": "ramp",
  "tutor-land-any": "ramp",
  "tutor-land-basic": "ramp",
  "tutor-land-specific": "ramp",
  fetchland: "ramp",
  "cost-reducer": "ramp",

  // Draw — strict card draw only (no impulsive/loot)
  draw: "draw",
  "pure-draw": "draw",
  "repeatable-pure-draw": "draw",
  "repeatable-draw": "draw",
  "force-draw": "draw",
  "draw-to-seven": "draw",

  // Counterspells
  counterspell: "counter",
  "counterspell-instant": "counter",
  "counterspell-sorcery": "counter",
  "counterspell-reusable": "counter",
  "counterspell-automatic": "counter",
  "counterspell-free": "counter",
  "counterspell-exile": "counter",
  "counterspell-bounce": "counter",
  "counterspell-soft": "counter",
  "counterspell-noncreature": "counter",
  "counterspell-creature": "counter",
  "counterspell-planeswalker": "counter",
  "counterspell-artifact": "counter",
  "counterspell-enchantment": "counter",
  "counterspell-aura": "counter",
  "counterspell-battle": "counter",
  "counterspell-ability": "counter",
  "counterspell-loyalty-ability": "counter",
  "synergy-counterspell": "counter",

  // Discard
  discard: "discard",
  "random-discard": "discard",
  "discard-symmetrical": "discard",
  "instant-speed-discard": "discard",
  "discard-with-set-s-mechanic": "discard",
};

const THEME_MAP: Record<string, SynergyTheme> = {
  // Sacrifice / Aristocrats
  "sacrifice-outlet": "sacrifice_aristocrats",
  "sacrifice-outlet-creature": "sacrifice_aristocrats",
  "sacrifice-outlet-artifact": "sacrifice_aristocrats",
  "sacrifice-outlet-token": "sacrifice_aristocrats",
  "sacrifice-outlet-permanent": "sacrifice_aristocrats",
  "repeatable-sacrifice-outlet": "sacrifice_aristocrats",
  "free-sacrifice-outlet": "sacrifice_aristocrats",
  "synergy-sacrifice": "sacrifice_aristocrats",
  "synergy-sacrifice-self": "sacrifice_aristocrats",
  "removal-sacrifice": "sacrifice_aristocrats",
  "alternate-cost-sacrifice": "sacrifice_aristocrats",
  "mutual-sacrifice": "sacrifice_aristocrats",

  // Graveyard recursion
  reanimate: "graveyard_recursion",
  "reanimate-creature": "graveyard_recursion",
  "reanimate-permanent": "graveyard_recursion",
  "castable-from-graveyard": "graveyard_recursion",
  "activate-from-graveyard": "graveyard_recursion",
  "gives-castable-from-graveyard": "graveyard_recursion",
  recursion: "graveyard_recursion",
  "recursion-creature": "graveyard_recursion",
  "recursion-permanent": "graveyard_recursion",
  "recursion-any": "graveyard_recursion",
  "recursion-from-exile": "graveyard_recursion",
  "graveyard-fuel": "graveyard_recursion",
  "graveyard-fuel-creature": "graveyard_recursion",
  "graveyard-fuel-permanent": "graveyard_recursion",

  // Tokens
  "creates-token-of-a-card": "tokens",
  "creates-oracle-token": "tokens",
  "repeatable-creature-tokens": "tokens",
  "repeatable-artifact-tokens": "tokens",
  "repeatable-enchantment-tokens": "tokens",
  "animate-token": "tokens",
  "copy-token": "tokens",
  "predefined-token": "tokens",

  // +1/+1 counters
  "counters-matter": "plus_one_counters",
  "move-counters": "plus_one_counters",
  "share-counters": "plus_one_counters",
  "synergy-proliferate": "plus_one_counters",
  "pseudo-proliferate": "plus_one_counters",

  // Spells matter
  magecraft: "spells_matter",
  "storm-like": "spells_matter",
  "second-spell-matters": "spells_matter",
  "third-spell-matters": "spells_matter",
  "fourth-spell-matters": "spells_matter",
  "cast-trigger": "spells_matter",
  "cast-trigger-you": "spells_matter",
  "instant-sorcery-dichotomous": "spells_matter",

  // Discard / Madness
  madness: "discard_madness",
  "synergy-madness": "discard_madness",
  "gives-madness": "discard_madness",
  "discard-outlet": "discard_madness",
  "discard-outlet-creature": "discard_madness",
  "discard-matters": "discard_madness",

  // Life gain / drain
  lifegain: "life_gain_drain",
  "repeatable-lifegain": "life_gain_drain",
  "gives-lifelink": "life_gain_drain",
  "gives-lifelink-noncreature": "life_gain_drain",
  "synergy-lifelink": "life_gain_drain",
  "drain-life": "life_gain_drain",
  "drain-creature": "life_gain_drain",
  "opponent-loses-life": "life_gain_drain",
  "lifegain-to-damage": "life_gain_drain",
  "alternate-cost-gain-life": "life_gain_drain",

  // Equipment / Voltron
  "synergy-equipment": "equipment_voltron",
  "synergy-equipment-legendary": "equipment_voltron",
  "affinity-for-equipment": "equipment_voltron",
  "auto-equip": "equipment_voltron",

  // Landfall
  landfall: "landfall",
  "landfall-other": "landfall",
  islandfall: "landfall",

  // Artifacts matter
  "artifact-matters": "artifacts_matter",
  "affinity-for-artifacts": "artifacts_matter",
  artifactfall: "artifacts_matter",
  "animate-artifact": "artifacts_matter",

  // Blink / Flicker
  flicker: "blink_flicker",
  "flicker-creature": "blink_flicker",
  "flicker-permanent": "blink_flicker",
  "flicker-self": "blink_flicker",
  "flicker-artifact": "blink_flicker",
  "flicker-enchantment": "blink_flicker",
  "flicker-planeswalker": "blink_flicker",

  // Burn
  burn: "burn",
  "burn-player": "burn",
  "burn-creature": "burn",
  "burn-any": "burn",
  "burn-you": "burn",
  "burn-player-each": "burn",

  // Tribal — typal support tags (creature-type lords use overrides)
  "cycle-m10-typal-lord": "tribal",
  "cycle-m11-typal-lord": "tribal",
  "cycle-m19-typal-lord": "tribal",
  "cycle-lrw-typal-lord": "tribal",
  "cycle-soi-typal-lord": "tribal",
  "cycle-mor-typal-counter-lord": "tribal",
  "typal-reveler": "tribal",

  // Mill
  mill: "mill",
  "mill-opponent": "mill",
  "mill-any": "mill",
  "mill-each": "mill",
  "synergy-mill": "mill",
};

export function mapTagSlugsToClassification(tagSlugs: string[]): {
  roles: FunctionalRole[];
  themes: SynergyTheme[];
} {
  const roles: FunctionalRole[] = [];
  const themes: SynergyTheme[] = [];

  for (const slug of tagSlugs) {
    const role = ROLE_MAP[slug];
    if (role) roles.push(role);

    const theme = THEME_MAP[slug];
    if (theme) themes.push(theme);
  }

  return {
    roles: uniqueSorted(roles),
    themes: uniqueSorted(themes),
  };
}

export function isAcceptedTagWeight(weight: string): boolean {
  return weight === "very_strong" || weight === "strong" || weight === "median";
}
