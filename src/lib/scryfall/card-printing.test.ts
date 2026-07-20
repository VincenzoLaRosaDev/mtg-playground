import { describe, expect, it } from "vitest";

import {
  buildCardVersionHref,
  parsePrintingFinish,
  parsePrintingOptionValue,
  printingOptionValue,
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

  it("parses option values and finishes", () => {
    expect(printingOptionValue({
      id: "1",
      setCode: "mh2",
      setName: "Modern Horizons 2",
      collectorNumber: "240",
      rarity: "rare",
      finishes: ["nonfoil", "foil"],
      imageUri: null,
    })).toBe("mh2|240");
    expect(parsePrintingOptionValue("mh2|240")).toEqual({
      setCode: "mh2",
      collectorNumber: "240",
    });
    expect(parsePrintingFinish("foil")).toBe("foil");
    expect(parsePrintingFinish("shiny")).toBeNull();
  });
});
