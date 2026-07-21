import { describe, expect, it } from "vitest";

import {
  buildCardSearchDocument,
  buildCardSearchDocumentFromScryfall,
  buildCardTextTsQueryExpression,
  countCardTextSearchTokens,
  resolveCardTextTsQueryMode,
  sanitizeCardTextSearchQuery,
} from "@/lib/search/card-text-search";

describe("buildCardSearchDocument", () => {
  it("includes top-level oracle text", () => {
    const doc = buildCardSearchDocument({
      name: "Doom Blade",
      typeLine: "Instant",
      oracleText: "Destroy target nonblack creature.",
    });
    expect(doc).toContain("destroy target nonblack creature");
  });

  it("includes face oracle text for DFC", () => {
    const doc = buildCardSearchDocument({
      name: "Delver of Secrets // Insectile Aberration",
      typeLine: "Creature — Human Wizard // Creature — Human Insect",
      oracleText: null,
      faces: [
        {
          name: "Delver of Secrets",
          typeLine: "Creature — Human Wizard",
          oracleText: "At the beginning of your upkeep, look at the top card of your library.",
          imageUri: null,
        },
        {
          name: "Insectile Aberration",
          typeLine: "Creature — Human Insect",
          oracleText: "Flying",
          imageUri: null,
        },
      ],
    });
    expect(doc).toContain("upkeep");
    expect(doc).toContain("flying");
    expect(doc).toContain("insectile aberration");
  });
});

describe("buildCardSearchDocumentFromScryfall", () => {
  it("reads card_faces oracle_text", () => {
    const doc = buildCardSearchDocumentFromScryfall({
      name: "Front // Back",
      type_line: "Creature // Creature",
      oracle_text: null,
      card_faces: [
        { name: "Front", type_line: "Creature — Elf", oracle_text: "Create a Food token." },
        { name: "Back", type_line: "Creature — Beast", oracle_text: "Trample" },
      ],
    });
    expect(doc).toContain("food");
    expect(doc).toContain("trample");
    expect(doc).toContain("elf");
  });
});

describe("sanitizeCardTextSearchQuery", () => {
  it("strips punctuation but keeps words", () => {
    expect(sanitizeCardTextSearchQuery("  destroy!!! target  ")).toBe("destroy target");
    expect(sanitizeCardTextSearchQuery("o'maul")).toBe("omaul");
  });
});

describe("buildCardTextTsQueryExpression", () => {
  it("uses prefix for a single token", () => {
    expect(buildCardTextTsQueryExpression("destroy")).toBe("destroy:*");
    expect(buildCardTextTsQueryExpression("judgmen")).toBe("judgmen:*");
    expect(resolveCardTextTsQueryMode("elf")).toBe("prefix");
    expect(countCardTextSearchTokens("elf")).toBe(1);
  });

  it("uses phrase adjacency with prefix on the last token", () => {
    expect(buildCardTextTsQueryExpression("destroy all creatu")).toBe(
      "destroy <-> all <-> creatu:*",
    );
    expect(buildCardTextTsQueryExpression("day of judgmen")).toBe(
      "day <-> of <-> judgmen:*",
    );
    expect(buildCardTextTsQueryExpression("destroy all creatures")).toBe(
      "destroy <-> all <-> creatures:*",
    );
    expect(resolveCardTextTsQueryMode("destroy all creature")).toBe("phrase_prefix");
  });
});
