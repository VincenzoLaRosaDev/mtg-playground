import { describe, expect, it } from "vitest";

import {
  normalizePastedCardName,
  parseDeckPaste,
} from "@/lib/decks/paste-parse";
import { frontFaceSearchKey } from "@/lib/decks/paste-resolve";

describe("normalizePastedCardName", () => {
  it("keeps front face of DFCs", () => {
    expect(
      normalizePastedCardName("Delver of Secrets // Insectile Aberration"),
    ).toBe("Delver of Secrets");
  });
});

describe("frontFaceSearchKey", () => {
  it("normalizes front face and strips apostrophes", () => {
    expect(frontFaceSearchKey("Tishana's Tidebinder")).toBe(
      "tishanas tidebinder",
    );
    expect(
      frontFaceSearchKey("Cecil, Dark Knight // Cecil, Redeemed Paladin"),
    ).toBe("cecil, dark knight");
  });
});

describe("parseDeckPaste", () => {
  it("parses Arena lines with set codes", () => {
    const result = parseDeckPaste(`Deck
4 Lightning Bolt (M10) 146
1 Forest (ZNR) 280
`);
    expect(result.errors).toEqual([]);
    expect(result.lines).toEqual([
      expect.objectContaining({
        quantity: 4,
        name: "Lightning Bolt",
        board: "main",
      }),
      expect.objectContaining({
        quantity: 1,
        name: "Forest",
        board: "main",
      }),
    ]);
  });

  it("skips Arena About metadata and captures deck name", () => {
    const result = parseDeckPaste(`About
Name Dimir Tempo

Deck
4 Consider (MID) 44
Sideboard
2 Negate (M20) 69
`);
    expect(result.deckName).toBe("Dimir Tempo");
    expect(result.errors).toEqual([]);
    expect(result.lines.map((l) => [l.board, l.name, l.quantity])).toEqual([
      ["main", "Consider", 4],
      ["side", "Negate", 2],
    ]);
  });

  it("parses sideboard and commander sections", () => {
    const result = parseDeckPaste(`1 Sol Ring
Sideboard
2 Negate
Commander
1 Atraxa, Praetors' Voice
`);
    expect(result.lines.map((l) => [l.board, l.name, l.quantity])).toEqual([
      ["main", "Sol Ring", 1],
      ["side", "Negate", 2],
      ["commander", "Atraxa, Praetors' Voice", 1],
    ]);
  });

  it("uses blank line as sideboard split for plain lists without headers", () => {
    const result = parseDeckPaste(`4 Lightning Bolt
2 Consider

2 Negate
1 Duress
`);
    expect(result.errors).toEqual([]);
    expect(result.lines.map((l) => [l.board, l.name, l.quantity])).toEqual([
      ["main", "Lightning Bolt", 4],
      ["main", "Consider", 2],
      ["side", "Negate", 2],
      ["side", "Duress", 1],
    ]);
  });

  it("does not treat blank lines as sideboard when Deck/Sideboard headers exist", () => {
    const result = parseDeckPaste(`Deck
4 Lightning Bolt

2 Consider
Sideboard
1 Negate
`);
    expect(result.lines.map((l) => [l.board, l.name])).toEqual([
      ["main", "Lightning Bolt"],
      ["main", "Consider"],
      ["side", "Negate"],
    ]);
  });

  it("parses plain name-only lines as qty 1", () => {
    const result = parseDeckPaste(`Sol Ring
Arcane Signet`);
    expect(result.lines).toHaveLength(2);
    expect(result.lines[0]).toMatchObject({ quantity: 1, name: "Sol Ring" });
  });

  it("skips maybeboard", () => {
    const result = parseDeckPaste(`1 Sol Ring
Maybeboard
1 Chrome Mox`);
    expect(result.lines).toHaveLength(1);
    expect(result.lines[0]?.name).toBe("Sol Ring");
  });
});
