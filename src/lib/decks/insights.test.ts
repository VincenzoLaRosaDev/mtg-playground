import { describe, expect, it } from "vitest";

import { summarizeDeckInsights } from "@/lib/decks/insights";

describe("summarizeDeckInsights", () => {
  it("counts GC on main + commander only", () => {
    const result = summarizeDeckInsights(
      [
        {
          oracleId: "a",
          quantity: 2,
          board: "main",
          isGameChanger: true,
        },
        {
          oracleId: "b",
          quantity: 1,
          board: "commander",
          isGameChanger: false,
        },
        {
          oracleId: "c",
          quantity: 3,
          board: "side",
          isGameChanger: true,
        },
      ],
      {},
    );

    expect(result.countedCopies).toBe(3);
    expect(result.gameChangerCount).toBe(2);
    expect(result.skeleton).toBeNull();
  });

  it("aggregates roles and themes by quantity", () => {
    const result = summarizeDeckInsights(
      [
        {
          oracleId: "sol",
          quantity: 1,
          board: "main",
          isGameChanger: false,
        },
        {
          oracleId: "draw",
          quantity: 2,
          board: "main",
          isGameChanger: false,
        },
      ],
      {
        sol: { roles: ["ramp"], themes: ["artifacts_matter"] },
        draw: { roles: ["draw", "ramp"], themes: [] },
      },
    );

    expect(result.roleCounts).toEqual([
      { key: "ramp", label: "ramp", count: 3, percent: 100 },
      { key: "draw", label: "draw", count: 2, percent: 66.7 },
    ]);
    expect(result.themeCounts).toEqual([
      {
        key: "artifacts_matter",
        label: "artifacts matter",
        count: 1,
        percent: 33.3,
      },
    ]);
    expect(result.themeOverlap.themedCopies).toBe(1);
    expect(result.themeOverlap.multiThemeCopies).toBe(0);
    expect(result.themeOverlap.topThemes).toHaveLength(1);
  });

  it("builds skeleton progress from role counts when requested", () => {
    const result = summarizeDeckInsights(
      [
        {
          oracleId: "a",
          quantity: 4,
          board: "main",
          isGameChanger: false,
        },
        {
          oracleId: "b",
          quantity: 2,
          board: "main",
          isGameChanger: false,
        },
      ],
      {
        a: { roles: ["ramp"], themes: [] },
        b: { roles: ["removal_hard", "removal_soft"], themes: [] },
      },
      { includeSkeleton: true },
    );

    expect(result.skeleton).not.toBeNull();
    const byKey = Object.fromEntries(
      (result.skeleton ?? []).map((row) => [row.key, row]),
    );
    expect(byKey.ramp).toMatchObject({ inDeck: 4, target: 10 });
    expect(byKey.removal).toMatchObject({ inDeck: 4, target: 10 });
    expect(byKey.draw).toMatchObject({ inDeck: 0, target: 10 });
  });

  it("returns zeros for an empty deck", () => {
    const result = summarizeDeckInsights([], {});
    expect(result).toMatchObject({
      countedCopies: 0,
      gameChangerCount: 0,
      roleCounts: [],
      themeCounts: [],
      skeleton: null,
    });
  });
});
