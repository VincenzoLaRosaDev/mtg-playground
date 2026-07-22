import { describe, expect, it } from "vitest";

import {
  buildCardVersionHref,
  parsePrintingFinish,
  parsePrintingOptionValue,
  printingOptionValue,
  resolveActiveFinish,
  resolveCardDetailView,
} from "@/lib/scryfall/card-printing";

describe("card version URLs", () => {
  it("builds set + cn + finish query", () => {
    expect(
      buildCardVersionHref("sol-ring", { set: "MH2", cn: "240", finish: "foil" }),
    ).toBe("/cards/sol-ring?set=mh2&cn=240&finish=foil");
  });

  it("omits default finish and empty version", () => {
    expect(buildCardVersionHref("sol-ring", {})).toBe("/cards/sol-ring");
    expect(buildCardVersionHref("sol-ring", { finish: "nonfoil" })).toBe(
      "/cards/sol-ring",
    );
  });

  it("includes view=commander when requested", () => {
    expect(
      buildCardVersionHref("sol-ring", {
        set: "mh2",
        cn: "240",
        view: "commander",
      }),
    ).toBe("/cards/sol-ring?set=mh2&cn=240&view=commander");
    expect(buildCardVersionHref("sol-ring", { view: "card" })).toBe(
      "/cards/sol-ring",
    );
  });

  it("resolves list view from commander flag + param", () => {
    expect(resolveCardDetailView(true, "commander")).toBe("commander");
    expect(resolveCardDetailView(true, undefined)).toBe("card");
    expect(resolveCardDetailView(false, "commander")).toBe("card");
  });

  it("parses option values and finishes", () => {
    expect(printingOptionValue({
      id: "1",
      setCode: "mh2",
      setName: "Modern Horizons 2",
      collectorNumber: "240",
      rarity: "rare",
      finishes: ["nonfoil", "foil"],
      imageUri: null,
      faces: [],
      prices: null,
    })).toBe("mh2|240");
    expect(parsePrintingOptionValue("mh2|240")).toEqual({
      setCode: "mh2",
      collectorNumber: "240",
    });
    expect(parsePrintingFinish("foil")).toBe("foil");
    expect(parsePrintingFinish("shiny")).toBeNull();
  });

  it("resolves active finish with nonfoil preference", () => {
    expect(resolveActiveFinish(["nonfoil", "foil"], null)).toBe("nonfoil");
    expect(resolveActiveFinish(["nonfoil", "foil"], "foil")).toBe("foil");
    expect(resolveActiveFinish(["foil", "etched"], null)).toBe("foil");
    expect(resolveActiveFinish(["foil", "etched"], "etched")).toBe("etched");
    expect(resolveActiveFinish([], "foil")).toBe("nonfoil");
  });
});
