import { describe, expect, it } from "vitest";

import {
  evaluateDeckLegality,
  formatDeckRules,
  isBasicLandTypeLine,
  maxCopiesForCard,
  mutationBlockReason,
  readFormatLegality,
} from "@/lib/decks/legality";
import type { DeckLegalityCardInput } from "@/lib/decks/legality";

function card(
  partial: Partial<DeckLegalityCardInput> &
    Pick<DeckLegalityCardInput, "oracleId" | "name">,
): DeckLegalityCardInput {
  return {
    quantity: 1,
    board: "main",
    typeLine: "Creature",
    colorIdentity: ["G"],
    isCommander: false,
    legalities: { modern: "legal", commander: "legal" },
    ...partial,
  };
}

describe("readFormatLegality", () => {
  it("reads status from JSON map", () => {
    expect(readFormatLegality({ modern: "banned" }, "modern")).toBe("banned");
    expect(readFormatLegality({ modern: "legal" }, "modern")).toBe("legal");
    expect(readFormatLegality({}, "modern")).toBe("unknown");
  });
});

describe("isBasicLandTypeLine", () => {
  it("detects basics", () => {
    expect(isBasicLandTypeLine("Basic Land — Forest")).toBe(true);
    expect(isBasicLandTypeLine("Land — Forest")).toBe(false);
  });
});

describe("formatDeckRules", () => {
  it("uses 100 for commander and 60 for brawl", () => {
    expect(formatDeckRules("commander").deckExact).toBe(100);
    expect(formatDeckRules("brawl").deckExact).toBe(60);
    expect(formatDeckRules("modern").mainMin).toBe(60);
    expect(formatDeckRules("modern").maxCopies).toBe(4);
  });
});

describe("maxCopiesForCard", () => {
  it("caps constructed at 4, commander at 1, restricted at 1, basics high", () => {
    expect(
      maxCopiesForCard({
        format: "modern",
        typeLine: "Instant",
        legalities: { modern: "legal" },
      }),
    ).toBe(4);
    expect(
      maxCopiesForCard({
        format: "commander",
        typeLine: "Creature",
        legalities: { commander: "legal" },
      }),
    ).toBe(1);
    expect(
      maxCopiesForCard({
        format: "vintage",
        typeLine: "Instant",
        legalities: { vintage: "restricted" },
      }),
    ).toBe(1);
    expect(
      maxCopiesForCard({
        format: "modern",
        typeLine: "Basic Land — Mountain",
        legalities: { modern: "legal" },
      }),
    ).toBe(99);
  });
});

describe("evaluateDeckLegality", () => {
  it("flags banned and not_legal cards", () => {
    const result = evaluateDeckLegality("modern", [
      card({
        oracleId: "a",
        name: "Bad",
        legalities: { modern: "banned" },
      }),
    ]);
    expect(result.ok).toBe(false);
    expect(result.issues.some((i) => i.code === "banned")).toBe(true);
  });

  it("enforces 4-of in constructed and singleton in commander", () => {
    const modern = evaluateDeckLegality("modern", [
      card({ oracleId: "bolt", name: "Bolt", quantity: 5 }),
    ]);
    expect(modern.issues.some((i) => i.code === "too_many_copies")).toBe(true);

    const edh = evaluateDeckLegality("commander", [
      card({
        oracleId: "cmd",
        name: "Cmd",
        board: "commander",
        isCommander: true,
        colorIdentity: ["R"],
        legalities: { commander: "legal" },
      }),
      card({
        oracleId: "bolt",
        name: "Bolt",
        quantity: 2,
        colorIdentity: ["R"],
        legalities: { commander: "legal" },
      }),
    ]);
    expect(edh.issues.some((i) => i.code === "too_many_copies")).toBe(true);
  });

  it("allows many basic lands", () => {
    const result = evaluateDeckLegality("commander", [
      card({
        oracleId: "cmd",
        name: "Cmd",
        board: "commander",
        isCommander: true,
        colorIdentity: ["G"],
        legalities: { commander: "legal" },
      }),
      card({
        oracleId: "forest",
        name: "Forest",
        quantity: 40,
        typeLine: "Basic Land — Forest",
        colorIdentity: ["G"],
        legalities: { commander: "legal" },
      }),
    ]);
    expect(result.issues.some((i) => i.code === "too_many_copies")).toBe(false);
  });

  it("checks constructed main size and sideboard cap", () => {
    const cards = Array.from({ length: 50 }, (_, i) =>
      card({
        oracleId: `c${i}`,
        name: `C${i}`,
        legalities: { modern: "legal" },
      }),
    );
    const result = evaluateDeckLegality("modern", cards);
    expect(result.issues.some((i) => i.code === "main_size")).toBe(true);
  });

  it("checks commander size and color identity", () => {
    const result = evaluateDeckLegality("commander", [
      card({
        oracleId: "cmd",
        name: "Green Cmd",
        board: "commander",
        isCommander: true,
        colorIdentity: ["G"],
        legalities: { commander: "legal" },
      }),
      card({
        oracleId: "blue",
        name: "Blue Spell",
        colorIdentity: ["U"],
        legalities: { commander: "legal" },
      }),
    ]);
    expect(result.issues.some((i) => i.code === "color_identity")).toBe(true);
    expect(result.issues.some((i) => i.code === "commander_size")).toBe(true);
  });
});

describe("mutationBlockReason", () => {
  it("blocks banned adds even when deck is incomplete", () => {
    const reason = mutationBlockReason({
      format: "modern",
      existing: [],
      next: card({
        oracleId: "x",
        name: "X",
        legalities: { modern: "banned" },
      }),
    });
    expect(reason).toMatch(/banned/i);
  });

  it("blocks color identity when commanders exist", () => {
    const reason = mutationBlockReason({
      format: "commander",
      existing: [
        card({
          oracleId: "cmd",
          name: "Cmd",
          board: "commander",
          isCommander: true,
          colorIdentity: ["G"],
          legalities: { commander: "legal" },
        }),
      ],
      next: card({
        oracleId: "u",
        name: "Blue",
        colorIdentity: ["U"],
        legalities: { commander: "legal" },
      }),
    });
    expect(reason).toMatch(/color identity/i);
  });

  it("does not block incomplete main size", () => {
    const reason = mutationBlockReason({
      format: "modern",
      existing: [],
      next: card({
        oracleId: "a",
        name: "A",
        legalities: { modern: "legal" },
      }),
    });
    expect(reason).toBeNull();
  });
});
