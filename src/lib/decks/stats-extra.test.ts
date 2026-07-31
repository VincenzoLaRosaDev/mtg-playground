import { describe, expect, it } from "vitest";

import { summarizeDeckEstCost } from "@/lib/decks/est-cost";
import { hypergeometricAtLeastPercent } from "@/lib/decks/hypergeometric";
import { pipColorsFromToken, summarizeDeckManaPips } from "@/lib/decks/mana-pips";
import { summarizeDeckManaProduction } from "@/lib/decks/mana-production";

describe("summarizeDeckComposition avg/total MV", () => {
  it("is covered via composition module expectations", async () => {
    const { summarizeDeckComposition } = await import("@/lib/decks/composition");
    const result = summarizeDeckComposition([
      {
        quantity: 2,
        board: "main",
        cmc: 2,
        typeLine: "Creature",
        colorIdentity: ["W"],
      },
      {
        quantity: 1,
        board: "main",
        cmc: 4,
        typeLine: "Creature",
        colorIdentity: ["W"],
      },
      {
        quantity: 10,
        board: "main",
        cmc: 0,
        typeLine: "Basic Land — Plains",
        colorIdentity: ["W"],
      },
    ]);
    expect(result.totalManaValue).toBe(8);
    expect(result.avgManaValue).toBeCloseTo(2.67, 1);
  });
});

describe("summarizeDeckEstCost", () => {
  it("sums preferred finish prices on main+commander", () => {
    const result = summarizeDeckEstCost([
      {
        quantity: 2,
        board: "main",
        prices: { eur: "1.50", usd: "2.00" },
        finish: "nonfoil",
      },
      {
        quantity: 1,
        board: "commander",
        prices: { eur: "10.00" },
        finish: "nonfoil",
      },
      {
        quantity: 4,
        board: "side",
        prices: { eur: "99.00" },
        finish: "nonfoil",
      },
    ]);
    expect(result.total).toBe(13);
    expect(result.currency).toBe("EUR");
    expect(result.label).toMatch(/13/);
    expect(result.pricedCopies).toBe(3);
  });
});

describe("mana pips", () => {
  it("parses hybrid and phyrexian tokens", () => {
    expect(pipColorsFromToken("W")).toEqual(["W"]);
    expect(pipColorsFromToken("W/U")).toEqual(["W", "U"]);
    expect(pipColorsFromToken("2")).toEqual([]);
    expect(pipColorsFromToken("C")).toEqual(["C"]);
  });

  it("aggregates spell pips excluding lands", () => {
    const result = summarizeDeckManaPips([
      {
        quantity: 2,
        board: "main",
        typeLine: "Creature",
        manaCost: "{1}{B}{G}",
      },
      {
        quantity: 1,
        board: "main",
        typeLine: "Basic Land — Swamp",
        manaCost: null,
      },
    ]);
    const byKey = Object.fromEntries(result.buckets.map((b) => [b.key, b]));
    expect(byKey.B?.pips).toBe(2);
    expect(byKey.G?.pips).toBe(2);
    expect(byKey.B?.cards).toBe(2);
  });
});

describe("mana production", () => {
  it("counts produced_mana sources", () => {
    const result = summarizeDeckManaProduction([
      {
        quantity: 10,
        board: "main",
        typeLine: "Basic Land — Forest",
        producedMana: ["G"],
      },
      {
        quantity: 1,
        board: "main",
        typeLine: "Artifact",
        producedMana: ["B", "G"],
      },
    ]);
    const byKey = Object.fromEntries(result.buckets.map((b) => [b.key, b]));
    expect(byKey.G?.mana).toBe(11);
    expect(byKey.B?.mana).toBe(1);
  });

  it("landsOnly skips nonlands", () => {
    const result = summarizeDeckManaProduction(
      [
        {
          quantity: 1,
          board: "main",
          typeLine: "Artifact",
          producedMana: ["C"],
        },
        {
          quantity: 5,
          board: "main",
          typeLine: "Land",
          producedMana: ["C"],
        },
      ],
      { landsOnly: true },
    );
    expect(result.buckets[0]?.mana).toBe(5);
  });
});

describe("summarizeDeckCurveBreakdowns", () => {
  it("splits nonland curves by color, permanence, roles, subtypes, rarity", async () => {
    const { summarizeDeckCurveBreakdowns } = await import(
      "@/lib/decks/curve-breakdowns"
    );
    const result = summarizeDeckCurveBreakdowns([
      {
        quantity: 2,
        board: "main",
        cmc: 1,
        typeLine: "Instant",
        manaCost: "{U}",
        colorIdentity: ["U"],
        rarity: "common",
        roles: ["counter"],
      },
      {
        quantity: 1,
        board: "main",
        cmc: 2,
        typeLine: "Creature — Horror",
        manaCost: "{1}{B}",
        colorIdentity: ["B"],
        rarity: "rare",
        roles: ["ramp"],
      },
      {
        quantity: 1,
        board: "main",
        cmc: 2,
        typeLine: "Creature — Horror Wizard",
        manaCost: "{U}{B}",
        colorIdentity: ["U", "B"],
        rarity: "mythic",
        roles: [],
      },
      {
        quantity: 10,
        board: "main",
        cmc: 0,
        typeLine: "Basic Land — Island",
        manaCost: null,
        colorIdentity: ["U"],
        rarity: "common",
        roles: [],
      },
    ]);

    const blue = result.byColor.find((s) => s.key === "U")!;
    const black = result.byColor.find((s) => s.key === "B")!;
    expect(blue.curve.find((b) => b.key === "1")?.count).toBe(2);
    expect(blue.curve.find((b) => b.key === "2")?.count).toBe(1);
    expect(black.curve.find((b) => b.key === "2")?.count).toBe(2);
    expect(result.byPermanence.find((s) => s.key === "nonpermanent")?.total).toBe(
      2,
    );
    expect(result.byPermanence.find((s) => s.key === "permanent")?.total).toBe(2);
    expect(result.byType.find((s) => s.key === "instant")?.total).toBe(2);
    expect(result.byRole.find((s) => s.key === "counter")?.total).toBe(2);
    expect(result.byRole.find((s) => s.key === "uncategorized")?.total).toBe(1);
    expect(result.bySubtype.find((s) => s.key === "Horror")?.total).toBe(2);
    expect(result.bySubtype.find((s) => s.key === "Wizard")?.total).toBe(1);
    expect(result.bySubtype.find((s) => s.key === "none")?.total).toBe(2);
    expect(result.byRarity.find((s) => s.key === "common")?.total).toBe(2);
    expect(result.byRarity.find((s) => s.key === "mythic")?.total).toBe(1);
  });
});

describe("summarizeDeckQuantityBreakdowns", () => {
  it("covers roles, types, subtypes, supertypes, MV, keywords", async () => {
    const { summarizeDeckQuantityBreakdowns } = await import(
      "@/lib/decks/quantity-breakdowns"
    );
    const result = summarizeDeckQuantityBreakdowns([
      {
        quantity: 2,
        board: "main",
        cmc: 1,
        typeLine: "Legendary Creature — Elf Warrior",
        keywords: ["Vigilance"],
        roles: ["ramp"],
      },
      {
        quantity: 4,
        board: "main",
        cmc: 0,
        typeLine: "Basic Land — Forest",
        keywords: [],
        roles: [],
      },
      {
        quantity: 1,
        board: "main",
        cmc: 3,
        typeLine: "Instant",
        keywords: ["Flash"],
        roles: ["counter"],
      },
    ]);

    expect(result.byRole.find((b) => b.key === "ramp")?.count).toBe(2);
    expect(result.byRole.find((b) => b.key === "uncategorized")?.count).toBe(4);
    expect(result.byType.find((b) => b.key === "land")?.count).toBe(4);
    expect(result.byType.find((b) => b.key === "creature")?.count).toBe(2);
    expect(result.bySubtype.find((b) => b.key === "Elf")?.count).toBe(2);
    expect(result.bySupertype.find((b) => b.key === "Legendary")?.count).toBe(2);
    expect(result.bySupertype.find((b) => b.key === "Basic")?.count).toBe(4);
    expect(result.byManaValue.find((b) => b.key === "0")?.count).toBe(4);
    expect(result.byManaValue.find((b) => b.key === "1")?.count).toBe(2);
    expect(result.byKeyword.find((b) => b.key === "Vigilance")?.count).toBe(2);
    expect(result.byKeyword.find((b) => b.key === "Flash")?.count).toBe(1);
  });
});

describe("hypergeometricAtLeastPercent", () => {
  it("returns ~95% for 33 lands in 99 with 7 draws", () => {
    // Archidekt sample-ish: Land 33 → high odds
    const pct = hypergeometricAtLeastPercent({
      deckSize: 99,
      successes: 33,
      draws: 7,
      atLeast: 1,
    });
    expect(pct).not.toBeNull();
    expect(pct!).toBeGreaterThan(90);
    expect(pct!).toBeLessThanOrEqual(100);
  });

  it("returns 0 when no successes", () => {
    expect(
      hypergeometricAtLeastPercent({
        deckSize: 60,
        successes: 0,
        draws: 7,
      }),
    ).toBe(0);
  });
});

describe("hypergeometricExactlyPercent", () => {
  it("matches known 4-of in 60 with 7 draws (~40%)", async () => {
    const { hypergeometricExactlyPercent, hypergeometricAtLeastPercent } =
      await import("@/lib/decks/hypergeometric");
    const exact1 = hypergeometricExactlyPercent({
      deckSize: 60,
      successes: 4,
      draws: 7,
      exactly: 1,
    });
    const atLeast1 = hypergeometricAtLeastPercent({
      deckSize: 60,
      successes: 4,
      draws: 7,
      atLeast: 1,
    });
    expect(exact1).not.toBeNull();
    expect(atLeast1).not.toBeNull();
    // P(X>=1) > P(X=1)
    expect(atLeast1!).toBeGreaterThan(exact1!);
    expect(atLeast1!).toBeGreaterThan(35);
    expect(atLeast1!).toBeLessThan(45);
  });
});

describe("summarizeDeckCardNameQuantities", () => {
  it("aggregates main+commander by name", async () => {
    const { summarizeDeckCardNameQuantities } = await import(
      "@/lib/decks/odds-rows"
    );
    const rows = summarizeDeckCardNameQuantities([
      { quantity: 2, board: "main", name: "Sol Ring" },
      { quantity: 1, board: "commander", name: "Sol Ring" },
      { quantity: 4, board: "side", name: "Shock" },
    ]);
    expect(rows).toEqual([{ key: "Sol Ring", label: "Sol Ring", count: 3 }]);
  });
});

describe("defaultOddsFacetForFormat", () => {
  it("uses Types for commander-like and Card Name otherwise", async () => {
    const { defaultOddsFacetForFormat } = await import("@/lib/decks/odds-rows");
    expect(defaultOddsFacetForFormat("commander")).toBe("type");
    expect(defaultOddsFacetForFormat("brawl")).toBe("type");
    expect(defaultOddsFacetForFormat("modern")).toBe("cardName");
    expect(defaultOddsFacetForFormat("standard")).toBe("cardName");
  });
});
