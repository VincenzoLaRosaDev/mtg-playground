import { describe, expect, it } from "vitest";

import { pickDeckCover } from "@/lib/decks/deck-cover";

describe("pickDeckCover", () => {
  it("returns null for empty deck", () => {
    expect(pickDeckCover([])).toBeNull();
  });

  it("prefers commander over higher-CMC main", () => {
    const cover = pickDeckCover([
      {
        board: "main",
        name: "Omniscience",
        typeLine: "Enchantment",
        cmc: 10,
        imageUri: "main.jpg",
      },
      {
        board: "commander",
        name: "Atraxa, Praetors' Voice",
        typeLine: "Legendary Creature — Phyrexian Angel Horror",
        cmc: 4,
        imageUri: "cmd.jpg",
      },
    ]);
    expect(cover).toEqual({
      name: "Atraxa, Praetors' Voice",
      imageUri: "cmd.jpg",
    });
  });

  it("picks first commander by name when partners", () => {
    const cover = pickDeckCover([
      {
        board: "commander",
        name: "Thrasios, Triton Hero",
        typeLine: "Legendary Creature — Merfolk Wizard",
        cmc: 2,
        imageUri: "t.jpg",
      },
      {
        board: "commander",
        name: "Bruse Tarl, Boorish Herder",
        typeLine: "Legendary Creature — Human Warrior",
        cmc: 4,
        imageUri: "b.jpg",
      },
    ]);
    expect(cover?.name).toBe("Bruse Tarl, Boorish Herder");
    expect(cover?.imageUri).toBe("b.jpg");
  });

  it("picks highest-CMC non-land main when no commander", () => {
    const cover = pickDeckCover([
      {
        board: "main",
        name: "Island",
        typeLine: "Basic Land — Island",
        cmc: 0,
        imageUri: "land.jpg",
      },
      {
        board: "main",
        name: "Lightning Bolt",
        typeLine: "Instant",
        cmc: 1,
        imageUri: "bolt.jpg",
      },
      {
        board: "main",
        name: "Craterhoof Behemoth",
        typeLine: "Creature — Beast",
        cmc: 8,
        imageUri: "hoof.jpg",
      },
      {
        board: "side",
        name: "Emrakul, the Aeons Torn",
        typeLine: "Legendary Creature — Eldrazi",
        cmc: 15,
        imageUri: "em.jpg",
      },
    ]);
    expect(cover).toEqual({
      name: "Craterhoof Behemoth",
      imageUri: "hoof.jpg",
    });
  });

  it("falls back to first main land when only lands", () => {
    const cover = pickDeckCover([
      {
        board: "main",
        name: "Swamp",
        typeLine: "Basic Land — Swamp",
        cmc: 0,
        imageUri: "s.jpg",
      },
      {
        board: "main",
        name: "Forest",
        typeLine: "Basic Land — Forest",
        cmc: 0,
        imageUri: "f.jpg",
      },
    ]);
    expect(cover?.name).toBe("Forest");
  });

  it("ignores sideboard and companion for cover", () => {
    const cover = pickDeckCover([
      {
        board: "companion",
        name: "Lurrus of the Dream-Den",
        typeLine: "Legendary Creature — Cat Nightmare",
        cmc: 3,
        imageUri: "lurrus.jpg",
      },
      {
        board: "main",
        name: "Thoughtseize",
        typeLine: "Sorcery",
        cmc: 1,
        imageUri: "ts.jpg",
      },
    ]);
    expect(cover?.name).toBe("Thoughtseize");
  });
});
