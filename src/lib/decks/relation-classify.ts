/**
 * Classify Scryfall all_parts targets for deck Tokens & Extras.
 *
 * Prefer a denylist of playable main-deck cards (Alchemy rebalances, conjure
 * targets, meld partners, …) over an allowlist of “extra” types — City's
 * Blessing, The Monarch, emblems, dungeons, etc. keep changing.
 */

const PIECE_LAYOUTS = new Set([
  "token",
  "double_faced_token",
  "emblem",
  "art_series",
]);

/** Non-deck pieces that still use a normal (or similar) layout. */
const NON_DECK_TYPE_RE =
  /\b(Dungeon|Conspiracy|Plane|Scheme|Phenomenon|Vanguard)\b/i;

/** True for cards that belong in a decklist, not Tokens/Extras. */
export function isPlayableDeckCard(layout: string, typeLine: string): boolean {
  if (PIECE_LAYOUTS.has(layout)) return false;
  if (NON_DECK_TYPE_RE.test(typeLine)) return false;
  return true;
}

/**
 * Map a resolved related oracle to Tokens / Extras, or null to drop.
 * Call after denylisting is unnecessary — this includes the denylist.
 */
export function classifyTokenOrExtra(
  layout: string,
  typeLine: string,
): "token" | "extra" | null {
  if (isPlayableDeckCard(layout, typeLine)) return null;
  if (/\bEmblem\b/i.test(typeLine) || layout === "emblem") return "extra";
  // Creature/artifact/… tokens
  if (/\bToken\b/i.test(typeLine)) return "token";
  // Token-set markers: City's Blessing, The Monarch, … (often type_line "Card")
  if (layout === "token" || layout === "double_faced_token") return "extra";
  // Dungeon / planechase / archenemy / …
  return "extra";
}
