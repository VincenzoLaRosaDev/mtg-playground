import { describe, expect, it } from "vitest";

import { parseCardBrowseParams } from "@/lib/browse/cards-params";

describe("parseCardBrowseParams", () => {
  it("defaults popular tab to rank / year window", () => {
    const params = parseCardBrowseParams(new URLSearchParams());

    expect(params.tab).toBe("popular");
    expect(params.window).toBe("year");
    expect(params.sort).toBe("rank");
    // rank uses ascending cursor order (inclusion inverted in the query layer)
    expect(params.order).toBe("asc");
  });

  it("rejects window=all for card top browse", () => {
    expect(() => parseCardBrowseParams(new URLSearchParams("window=all"))).toThrow(
      /window=all is not supported/,
    );
  });

  it("parses catalog tab filters", () => {
    const params = parseCardBrowseParams(
      new URLSearchParams({
        tab: "all",
        sort: "cmc",
        order: "asc",
        q: "sol",
        color: "W,U",
        cmc_min: "1",
        cmc_max: "3",
        type: "Artifact",
        commander: "legal",
        commanders_only: "true",
        rarity: "rare,mythic",
        has_edhrec: "true",
      }),
    );

    expect(params.tab).toBe("all");
    expect(params.sort).toBe("cmc");
    expect(params.order).toBe("asc");
    expect(params.filters).toMatchObject({
      query: "sol",
      colors: ["W", "U"],
      cmcMin: 1,
      cmcMax: 3,
      typeContains: "Artifact",
      commanderLegal: true,
      commandersOnly: true,
      hasEdhrec: true,
    });
    expect(params.filters?.rarities).toEqual(expect.arrayContaining(["rare", "mythic"]));
  });

  it("falls back invalid popular sort to rank", () => {
    const params = parseCardBrowseParams(new URLSearchParams("sort=cmc"));
    expect(params.tab).toBe("popular");
    expect(params.sort).toBe("rank");
  });
});
