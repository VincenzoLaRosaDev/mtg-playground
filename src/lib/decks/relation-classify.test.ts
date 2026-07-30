import { describe, expect, it } from "vitest";

import {
  classifyTokenOrExtra,
  isPlayableDeckCard,
} from "@/lib/decks/relation-classify";

describe("isPlayableDeckCard", () => {
  it("denylists normal/saga creatures and alchemy cards", () => {
    expect(isPlayableDeckCard("normal", "Creature — Vampire")).toBe(true);
    expect(isPlayableDeckCard("saga", "Enchantment — Saga")).toBe(true);
  });

  it("keeps token/emblem layouts and dungeons", () => {
    expect(isPlayableDeckCard("token", "Card")).toBe(false);
    expect(isPlayableDeckCard("emblem", "Emblem — Kaito")).toBe(false);
    expect(isPlayableDeckCard("normal", "Dungeon")).toBe(false);
  });
});

describe("classifyTokenOrExtra", () => {
  it("puts Treasure-like tokens on Tokens", () => {
    expect(
      classifyTokenOrExtra("token", "Token Artifact — Treasure"),
    ).toBe("token");
  });

  it("puts emblems and Card markers on Extras", () => {
    expect(classifyTokenOrExtra("emblem", "Emblem — Kaito")).toBe("extra");
    expect(classifyTokenOrExtra("token", "Card")).toBe("extra");
    expect(classifyTokenOrExtra("token", "Emblem")).toBe("extra");
  });

  it("puts dungeons on Extras", () => {
    expect(classifyTokenOrExtra("normal", "Dungeon")).toBe("extra");
  });

  it("drops playable combo_piece targets", () => {
    expect(classifyTokenOrExtra("normal", "Creature — Bird")).toBeNull();
    expect(classifyTokenOrExtra("normal", "Creature — Vampire")).toBeNull();
  });
});
