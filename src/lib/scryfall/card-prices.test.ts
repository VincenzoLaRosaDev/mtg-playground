import { describe, expect, it } from "vitest";

import {
  getCardPriceLabels,
  parseCatalogListPrice,
  pickCatalogPriceStrings,
} from "@/lib/scryfall/card-prices";

describe("card-prices EUR-first", () => {
  it("prefers eur over usd for labels", () => {
    const labels = getCardPriceLabels({
      usd: "2.00",
      usd_foil: "4.00",
      eur: "1.50",
      eur_foil: "3.00",
    });
    expect(labels.currency).toBe("EUR");
    expect(labels.regular).toBe("€1.50");
    expect(labels.foil).toBe("€3.00");
  });

  it("falls back to usd when eur is missing", () => {
    const labels = getCardPriceLabels({
      usd: "2.00",
      usd_foil: "4.00",
    });
    expect(labels.currency).toBe("USD");
    expect(labels.regular).toBe("$2.00");
    expect(labels.foil).toBe("$4.00");
  });

  it("uses eur_etched when eur_foil is absent", () => {
    const picked = pickCatalogPriceStrings({
      eur: "1.00",
      eur_etched: "2.50",
    });
    expect(picked.currency).toBe("EUR");
    expect(picked.foil).toBe("2.50");
  });

  it("parses numeric list price from eur", () => {
    expect(parseCatalogListPrice({ eur: "12.34", usd: "9.00" })).toBe(12.34);
    expect(parseCatalogListPrice({ usd: "9.00" })).toBe(9);
    expect(parseCatalogListPrice(null)).toBeNull();
  });
});
