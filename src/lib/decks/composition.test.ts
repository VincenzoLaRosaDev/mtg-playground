import { describe, expect, it } from "vitest";

import { summarizeDeckComposition } from "@/lib/decks/composition";

describe("summarizeDeckComposition", () => {
  it("ignores sideboard and counts lands separately from curve", () => {
    const result = summarizeDeckComposition([
      {
        quantity: 2,
        board: "main",
        cmc: 2,
        typeLine: "Creature — Human",
        colorIdentity: ["W"],
      },
      {
        quantity: 1,
        board: "commander",
        cmc: 4,
        typeLine: "Legendary Creature — Dragon",
        colorIdentity: ["R", "G"],
      },
      {
        quantity: 10,
        board: "main",
        cmc: 0,
        typeLine: "Basic Land — Mountain",
        colorIdentity: ["R"],
      },
      {
        quantity: 4,
        board: "side",
        cmc: 1,
        typeLine: "Instant",
        colorIdentity: ["U"],
      },
    ]);

    expect(result.countedCopies).toBe(13);
    expect(result.landCopies).toBe(10);
    expect(result.nonlandCopies).toBe(3);
    expect(result.landPercent).toBeCloseTo(76.9, 0);

    const byCmc = Object.fromEntries(result.curve.map((b) => [b.key, b.count]));
    expect(byCmc["2"]).toBe(2);
    expect(byCmc["4"]).toBe(1);
    expect(byCmc["0"]).toBe(0); // lands excluded from curve

    expect(result.types.find((t) => t.id === "creature")?.count).toBe(3);
    expect(result.types.find((t) => t.id === "land")?.count).toBe(10);

    expect(result.colors.map((c) => c.key)).toEqual(["W", "R", "G"]);
  });

  it("buckets CMC 7+ and colorless identity", () => {
    const result = summarizeDeckComposition([
      {
        quantity: 1,
        board: "main",
        cmc: 9,
        typeLine: "Artifact",
        colorIdentity: [],
      },
      {
        quantity: 2,
        board: "main",
        cmc: 7,
        typeLine: "Sorcery",
        colorIdentity: [],
      },
    ]);

    expect(result.curve.find((b) => b.key === "7+")?.count).toBe(3);
    expect(result.colors).toEqual([
      { key: "C", label: "Colorless", count: 3 },
    ]);
  });

  it("returns empty stats for no counted cards", () => {
    const result = summarizeDeckComposition([
      {
        quantity: 1,
        board: "side",
        cmc: 1,
        typeLine: "Instant",
        colorIdentity: ["U"],
      },
    ]);
    expect(result.countedCopies).toBe(0);
    expect(result.landPercent).toBe(0);
    expect(result.types).toEqual([]);
    expect(result.colors).toEqual([]);
    expect(result.avgManaValue).toBe(0);
    expect(result.totalManaValue).toBe(0);
  });
});
