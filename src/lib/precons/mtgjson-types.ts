/**
 * MTGJSON deck `type` allowlist + format mapping for Phase 2.3 precons.
 * Constructed ready-to-play products only (plan 1B).
 *
 * MTGJSON DeckList uses human-readable types (e.g. "Commander Deck"), not short keys.
 */

import {
  isScryfallBrowseFormat,
  type ScryfallBrowseFormat,
} from "@/lib/formats/scryfall-formats";

/** Exact MTGJSON DeckList `type` strings we ingest (case-insensitive match). */
export const MTGJSON_CONSTRUCTED_DECK_TYPES = [
  "Commander Deck",
  "MTGO Commander Deck",
  "Duel Deck",
  "MTGO Duel Deck",
  "Brawl Deck",
  "Historic Brawl Precon Deck",
  "Challenger Deck",
  "Pioneer Challenger Deck",
  "Challenge Deck",
  "Event Deck",
  "Modern Event Deck",
  "Starter Deck",
  "Advanced Deck",
  "Arena Starter Deck",
  "Arena Starter Kit",
  "Arena Promotional Deck",
  "Welcome Deck",
  "Intro Pack",
  "Theme Deck",
  "MTGO Theme Deck",
  "Planeswalker Deck",
  "Planechase Deck",
  "Archenemy Deck",
  "Game Night Deck",
  "Guild Kit",
  "Clash Pack",
  "Premium Deck",
  "Enhanced Deck",
  "Starter Kit",
  "Spellslinger Starter Kit",
  "Pro Tour Deck",
  "World Championship Deck",
  "Halfdeck",
] as const;

export type MtgjsonConstructedDeckType =
  (typeof MTGJSON_CONSTRUCTED_DECK_TYPES)[number];

const TYPE_SET = new Set(
  MTGJSON_CONSTRUCTED_DECK_TYPES.map((t) => t.toLowerCase()),
);

function normalizeType(type: string): string {
  return type.trim().toLowerCase();
}

export function isMtgjsonConstructedDeckType(
  type: string,
): type is MtgjsonConstructedDeckType {
  return TYPE_SET.has(normalizeType(type));
}

function formatFromNameHints(haystack: string): ScryfallBrowseFormat | null {
  if (/\bpioneer\b/.test(haystack)) return "pioneer";
  if (/\bmodern\b/.test(haystack)) return "modern";
  if (/\blegacy\b/.test(haystack)) return "legacy";
  if (/\bvintage\b/.test(haystack)) return "vintage";
  if (/\bpauper\b/.test(haystack)) return "pauper";
  if (/\bhistoric\b/.test(haystack)) return "historic";
  if (/\btimeless\b/.test(haystack)) return "timeless";
  if (/\balchemy\b/.test(haystack)) return "alchemy";
  if (/\bexplorer\b/.test(haystack)) return "pioneer";
  if (/\bcommander\b/.test(haystack) || /\bedh\b/.test(haystack)) {
    return "commander";
  }
  if (/\bbrawl\b/.test(haystack)) return "brawl";
  if (/\boathbreaker\b/.test(haystack)) return "oathbreaker";
  return null;
}

/**
 * Map MTGJSON deck type (+ optional name/code hints) → Scryfall browse format.
 * Returns null when we cannot map confidently (sync should skip).
 */
export function mapMtgjsonDeckToFormat(input: {
  type: string;
  name?: string | null;
  code?: string | null;
}): ScryfallBrowseFormat | null {
  const type = normalizeType(input.type);
  const name = (input.name ?? "").toLowerCase();
  const code = (input.code ?? "").toLowerCase();
  const haystack = `${name} ${code}`;

  if (
    type === "commander deck" ||
    type === "mtgo commander deck" ||
    type === "planechase deck" ||
    type === "archenemy deck"
  ) {
    return "commander";
  }
  if (type === "duel deck" || type === "mtgo duel deck") return "duel";
  if (type === "brawl deck" || type === "historic brawl precon deck") {
    return "brawl";
  }

  if (type === "pioneer challenger deck") return "pioneer";
  if (type === "modern event deck") return "modern";

  if (
    type === "challenger deck" ||
    type === "challenge deck" ||
    type === "event deck"
  ) {
    return formatFromNameHints(haystack) ?? "standard";
  }

  if (
    type === "starter deck" ||
    type === "advanced deck" ||
    type === "arena starter deck" ||
    type === "arena starter kit" ||
    type === "arena promotional deck" ||
    type === "welcome deck" ||
    type === "intro pack" ||
    type === "theme deck" ||
    type === "mtgo theme deck" ||
    type === "planeswalker deck" ||
    type === "game night deck" ||
    type === "guild kit" ||
    type === "clash pack" ||
    type === "premium deck" ||
    type === "enhanced deck" ||
    type === "starter kit" ||
    type === "spellslinger starter kit" ||
    type === "pro tour deck" ||
    type === "world championship deck" ||
    type === "halfdeck"
  ) {
    return formatFromNameHints(haystack) ?? "standard";
  }

  if (!isMtgjsonConstructedDeckType(input.type)) return null;
  if (isScryfallBrowseFormat(type)) return type;
  return null;
}
