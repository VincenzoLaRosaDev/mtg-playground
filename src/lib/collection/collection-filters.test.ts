import { describe, expect, it } from "vitest";

import {
  buildCollectionSearchParams,
  hasActiveCollectionFacets,
  parseCollectionFinishesParam,
  parseCollectionListQuery,
} from "@/lib/collection/collection-filters";

describe("parseCollectionListQuery", () => {
  it("parses catalog-like facets and collection scope", () => {
    const query = parseCollectionListQuery({
      filter: "owned",
      sort: "name",
      order: "desc",
      q: "sol ring",
      color: "w,u",
      rarity: "rare,mythic",
      type: "Artifact",
      cmc_min: "1",
      cmc_max: "3",
      format: "commander",
      finish: "foil,etched",
      set: "mh2",
    });

    expect(query).toMatchObject({
      filter: "owned",
      sort: "name",
      order: "desc",
      query: "sol ring",
      colors: ["W", "U"],
      rarities: ["rare", "mythic"],
      typeContains: "Artifact",
      cmcMin: 1,
      cmcMax: 3,
      format: "commander",
      finishes: ["foil", "etched"],
      setQuery: "mh2",
    });
  });

  it("omits defaults from search params", () => {
    const params = buildCollectionSearchParams(
      parseCollectionListQuery({
        filter: "all",
        sort: "updated",
        color: "R",
        finish: "foil",
      }),
    );

    expect(params.get("filter")).toBeNull();
    expect(params.get("sort")).toBeNull();
    expect(params.get("color")).toBe("R");
    expect(params.get("finish")).toBe("foil");
  });
});

describe("parseCollectionFinishesParam", () => {
  it("whitelists finishes and dedupes", () => {
    expect(parseCollectionFinishesParam("foil,shiny,foil,nonfoil")).toEqual([
      "foil",
      "nonfoil",
    ]);
  });
});

describe("hasActiveCollectionFacets", () => {
  it("detects any active facet", () => {
    expect(hasActiveCollectionFacets({})).toBe(false);
    expect(hasActiveCollectionFacets({ finishes: ["foil"] })).toBe(true);
  });
});
