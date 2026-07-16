import { describe, expect, it } from "vitest";

import { normalizeSearchName, toEdhrecSlug } from "@/lib/scryfall/card-utils";
import {
  isExcludedCatalogLayout,
  shouldIndexScryfallCard,
} from "@/lib/scryfall/catalog-filters";

describe("toEdhrecSlug", () => {
  it("strips accents and apostrophes like EDHREC", () => {
    expect(toEdhrecSlug("Gorion's Ward")).toBe("gorions-ward");
    expect(toEdhrecSlug("Adéwalé")).toBe("adewale");
    expect(toEdhrecSlug("O'Maul")).toBe("omaul");
  });

  it("uses DFC front face only", () => {
    expect(toEdhrecSlug("Delver of Secrets // Insectile Aberration")).toBe(
      "delver-of-secrets",
    );
  });

  it("collapses punctuation and trims hyphens", () => {
    expect(toEdhrecSlug("  Sol Ring!!!  ")).toBe("sol-ring");
    expect(toEdhrecSlug("Atraxa, Praetors' Voice")).toBe("atraxa-praetors-voice");
  });
});

describe("normalizeSearchName", () => {
  it("lowercases and strips diacritics without removing apostrophes", () => {
    expect(normalizeSearchName("Adéwalé")).toBe("adewale");
    expect(normalizeSearchName("  Sol Ring  ")).toBe("sol ring");
  });
});

describe("catalog layout filters", () => {
  it("excludes art_series from the playable catalog", () => {
    expect(isExcludedCatalogLayout("art_series")).toBe(true);
    expect(shouldIndexScryfallCard({ layout: "art_series" })).toBe(false);
    expect(shouldIndexScryfallCard({ layout: "normal" })).toBe(true);
  });
});
