import { describe, expect, it } from "vitest";

import {
  compareByCmcThenName,
  groupDeckCardsByType,
  primaryTypeGroupId,
  typeLineTypeWords,
} from "@/lib/decks/card-type-groups";

describe("typeLineTypeWords", () => {
  it("strips subtypes and uses the front face of DFCs", () => {
    expect(typeLineTypeWords("Legendary Creature — Human Cleric")).toBe(
      "Legendary Creature",
    );
    expect(
      typeLineTypeWords("Creature — Human Wizard // Creature — Wolf"),
    ).toBe("Creature");
  });
});

describe("primaryTypeGroupId", () => {
  it("prefers Creature over Artifact / Enchantment", () => {
    expect(primaryTypeGroupId("Artifact Creature — Vehicle")).toBe("creature");
    expect(primaryTypeGroupId("Enchantment Creature — Nymph")).toBe("creature");
    expect(primaryTypeGroupId("Legendary Artifact Creature — Golem")).toBe(
      "creature",
    );
  });

  it("classifies common non-creature buckets", () => {
    expect(primaryTypeGroupId("Instant")).toBe("instant");
    expect(primaryTypeGroupId("Tribal Instant — Elf")).toBe("instant");
    expect(primaryTypeGroupId("Sorcery")).toBe("sorcery");
    expect(primaryTypeGroupId("Artifact — Equipment")).toBe("artifact");
    expect(primaryTypeGroupId("Enchantment — Aura")).toBe("enchantment");
    expect(primaryTypeGroupId("Legendary Planeswalker — Jace")).toBe(
      "planeswalker",
    );
    expect(primaryTypeGroupId("Battle — Siege")).toBe("battle");
    expect(primaryTypeGroupId("Basic Snow Land — Island")).toBe("land");
    expect(primaryTypeGroupId("Artifact Land")).toBe("artifact");
  });

  it("uses the front face for transform / MDFC lines", () => {
    expect(
      primaryTypeGroupId("Creature — Human // Land"),
    ).toBe("creature");
    expect(
      primaryTypeGroupId("Land // Creature — Elemental"),
    ).toBe("land");
  });

  it("falls back to other", () => {
    expect(primaryTypeGroupId("Dungeon")).toBe("other");
    expect(primaryTypeGroupId("")).toBe("other");
  });
});

describe("groupDeckCardsByType", () => {
  it("orders groups Goldfish-style and sorts by CMC then name", () => {
    const groups = groupDeckCardsByType([
      { name: "Shock", typeLine: "Instant", cmc: 1, quantity: 4 },
      { name: "Forest", typeLine: "Basic Land — Forest", cmc: 0, quantity: 10 },
      { name: "Grizzly Bears", typeLine: "Creature — Bear", cmc: 2, quantity: 2 },
      { name: "Sol Ring", typeLine: "Artifact", cmc: 1, quantity: 1 },
      { name: "Annul", typeLine: "Instant", cmc: 1, quantity: 2 },
      {
        name: "Colossal Dreadmaw",
        typeLine: "Creature — Dinosaur",
        cmc: 6,
        quantity: 1,
      },
    ]);

    expect(groups.map((g) => g.id)).toEqual([
      "creature",
      "instant",
      "artifact",
      "land",
    ]);
    expect(groups[0]!.cards.map((c) => c.name)).toEqual([
      "Grizzly Bears",
      "Colossal Dreadmaw",
    ]);
    expect(groups[1]!.totalQuantity).toBe(6);
    expect(groups[1]!.cards.map((c) => c.name)).toEqual(["Annul", "Shock"]);
  });
});

describe("compareByCmcThenName", () => {
  it("sorts lower CMC first, then name", () => {
    const rows = [
      { name: "B", cmc: 2 },
      { name: "A", cmc: 2 },
      { name: "C", cmc: 1 },
    ];
    expect([...rows].sort(compareByCmcThenName).map((r) => r.name)).toEqual([
      "C",
      "A",
      "B",
    ]);
  });
});
