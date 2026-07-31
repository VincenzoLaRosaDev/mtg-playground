import { describe, expect, it } from "vitest";

import { summarizeDeckCoherence } from "@/lib/decks/coherence";
import type { DeckComposition } from "@/lib/decks/composition";
import type { DeckInsights } from "@/lib/decks/insights";

function emptyComposition(
  patch: Partial<DeckComposition> = {},
): DeckComposition {
  return {
    countedCopies: 0,
    landCopies: 0,
    nonlandCopies: 0,
    landPercent: 0,
    totalManaValue: 0,
    avgManaValue: 0,
    curve: [],
    types: [],
    colors: [],
    ...patch,
  };
}

function emptyInsights(patch: Partial<DeckInsights> = {}): DeckInsights {
  return {
    countedCopies: 0,
    gameChangerCount: 0,
    roleCounts: [],
    themeCounts: [],
    themeOverlap: {
      themedCopies: 0,
      themedPercent: 0,
      multiThemeCopies: 0,
      topThemes: [],
    },
    skeleton: null,
    ...patch,
  };
}

describe("summarizeDeckCoherence", () => {
  it("returns empty-deck info when no counted copies", () => {
    const alerts = summarizeDeckCoherence({
      format: "commander",
      composition: emptyComposition(),
      insights: emptyInsights(),
      mainCopies: 0,
    });
    expect(alerts).toHaveLength(1);
    expect(alerts[0]?.id).toBe("empty-deck");
  });

  it("warns on low commander land count", () => {
    const alerts = summarizeDeckCoherence({
      format: "commander",
      composition: emptyComposition({
        countedCopies: 100,
        landCopies: 20,
        nonlandCopies: 80,
        landPercent: 20,
      }),
      insights: emptyInsights({ countedCopies: 100, skeleton: null }),
      mainCopies: 99,
    });
    expect(alerts.some((a) => a.id === "lands-low-commander")).toBe(true);
  });

  it("warns when skeleton roles are far below target", () => {
    const alerts = summarizeDeckCoherence({
      format: "commander",
      composition: emptyComposition({
        countedCopies: 100,
        landCopies: 36,
        nonlandCopies: 64,
        landPercent: 36,
      }),
      insights: emptyInsights({
        countedCopies: 100,
        skeleton: [
          { key: "ramp", label: "Ramp", target: 10, inDeck: 1 },
          { key: "draw", label: "Draw", target: 10, inDeck: 10 },
        ],
      }),
      mainCopies: 99,
    });
    expect(alerts.some((a) => a.id === "skeleton-ramp")).toBe(true);
    expect(alerts.some((a) => a.id === "skeleton-draw")).toBe(false);
  });
});
