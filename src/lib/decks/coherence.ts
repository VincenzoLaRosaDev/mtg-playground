/**
 * Soft format-coherence advisories (Phase 3.4).
 * Never blocks edits — legality stays in `evaluateDeckLegality`.
 */

import { isCommanderLikeFormat, type DeckBoard } from "@/lib/decks/boards";
import type { DeckComposition } from "@/lib/decks/composition";
import type { DeckInsights } from "@/lib/decks/insights";

export type CoherenceSeverity = "info" | "warning";

export type CoherenceAlert = {
  id: string;
  severity: CoherenceSeverity;
  message: string;
};

/** Commander-like land band (informational). */
const COMMANDER_LAND_MIN = 33;
const COMMANDER_LAND_MAX = 42;

/** 60-card constructed land band (informational). */
const CONSTRUCTED_LAND_MIN = 18;
const CONSTRUCTED_LAND_MAX = 28;

/** Skeleton roles considered critical when far below target. */
const SKELETON_WARN_RATIO = 0.3;

export type CoherenceInput = {
  format: string;
  composition: DeckComposition;
  insights: DeckInsights;
  /** Total main-board copies (for “tiny deck” checks). */
  mainCopies: number;
};

function sumBoard(
  cards: readonly { board: DeckBoard; quantity: number }[],
  board: DeckBoard,
): number {
  return cards.reduce(
    (sum, row) => (row.board === board ? sum + row.quantity : sum),
    0,
  );
}

export function mainBoardCopies(
  cards: readonly { board: DeckBoard; quantity: number }[],
): number {
  return sumBoard(cards, "main");
}

/**
 * Build soft advisories from composition + insights.
 */
export function summarizeDeckCoherence(input: CoherenceInput): CoherenceAlert[] {
  const alerts: CoherenceAlert[] = [];
  const { format, composition, insights, mainCopies } = input;
  const commanderLike = isCommanderLikeFormat(format);

  if (composition.countedCopies === 0) {
    alerts.push({
      id: "empty-deck",
      severity: "info",
      message: "Add cards to the main deck to see composition and coherence hints.",
    });
    return alerts;
  }

  if (mainCopies > 0 && mainCopies < 20) {
    alerts.push({
      id: "tiny-main",
      severity: "info",
      message: `Main deck is small (${mainCopies} cards) — composition stats will shift as you build.`,
    });
  }

  const lands = composition.landCopies;
  if (commanderLike) {
    if (lands > 0 && lands < COMMANDER_LAND_MIN) {
      alerts.push({
        id: "lands-low-commander",
        severity: "warning",
        message: `Only ${lands} lands (typical Commander range ~${COMMANDER_LAND_MIN}–${COMMANDER_LAND_MAX}).`,
      });
    } else if (lands > COMMANDER_LAND_MAX) {
      alerts.push({
        id: "lands-high-commander",
        severity: "info",
        message: `${lands} lands is above the usual Commander band (~${COMMANDER_LAND_MIN}–${COMMANDER_LAND_MAX}).`,
      });
    }
  } else if (composition.countedCopies >= 40) {
    if (lands > 0 && lands < CONSTRUCTED_LAND_MIN) {
      alerts.push({
        id: "lands-low-constructed",
        severity: "warning",
        message: `Only ${lands} lands (typical 60-card range ~${CONSTRUCTED_LAND_MIN}–${CONSTRUCTED_LAND_MAX}).`,
      });
    } else if (lands > CONSTRUCTED_LAND_MAX) {
      alerts.push({
        id: "lands-high-constructed",
        severity: "info",
        message: `${lands} lands is above the usual constructed band (~${CONSTRUCTED_LAND_MIN}–${CONSTRUCTED_LAND_MAX}).`,
      });
    }
  }

  if (insights.skeleton) {
    for (const row of insights.skeleton) {
      if (row.target <= 0) continue;
      if (row.inDeck < row.target * SKELETON_WARN_RATIO) {
        alerts.push({
          id: `skeleton-${row.key}`,
          severity: "warning",
          message: `Low ${row.label.toLowerCase()} (${row.inDeck}/${row.target} vs build skeleton).`,
        });
      }
    }
  }

  return alerts;
}
