import { describe, expect, it } from "vitest";

import { normalizeSearchName, toCardSlug } from "@/lib/scryfall/card-utils";
import {
  isExcludedCatalogLayout,
  shouldIndexScryfallCard,
} from "@/lib/scryfall/catalog-filters";

describe("toCardSlug", () => {
  it("strips apostrophes without turning them into hyphens", () => {
    expect(toCardSlug("Gorion's Ward")).toBe("gorions-ward");
    expect(toCardSlug("Adéwalé")).toBe("adewale");
    expect(toCardSlug("O'Maul")).toBe("omaul");
  });

  it("uses the front face of DFCs", () => {
    expect(toCardSlug("Delver of Secrets // Insectile Aberration")).toBe(
      "delver-of-secrets",
    );
  });

  it("normalizes punctuation and spacing", () => {
    expect(toCardSlug("  Sol Ring!!!  ")).toBe("sol-ring");
    expect(toCardSlug("Atraxa, Praetors' Voice")).toBe("atraxa-praetors-voice");
  });
});

describe("normalizeSearchName", () => {
  it("lowercases and strips diacritics", () => {
    expect(normalizeSearchName("Adéwalé")).toBe("adewale");
    expect(normalizeSearchName("  Sol Ring  ")).toBe("sol ring");
  });

  it("strips apostrophes so FTS/slug/query agree", () => {
    expect(normalizeSearchName("Y'shtola, Night's Blessed")).toBe(
      "yshtola, nights blessed",
    );
    expect(normalizeSearchName("O'Maul")).toBe("omaul");
    expect(normalizeSearchName("Gorion's Ward")).toBe("gorions ward");
  });
});

describe("catalog layout filters", () => {
  it("excludes art_series", () => {
    expect(isExcludedCatalogLayout("art_series")).toBe(true);
    expect(shouldIndexScryfallCard({ layout: "normal" })).toBe(true);
    expect(shouldIndexScryfallCard({ layout: "art_series" })).toBe(false);
  });
});
