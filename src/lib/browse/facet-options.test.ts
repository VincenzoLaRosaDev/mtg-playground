import { describe, expect, it } from "vitest";

import {
  buildRoleFilterOptions,
  buildThemeFilterOptions,
} from "@/lib/browse/cards-shared";
import {
  buildSetTypeFilterOptions,
  labelSetType,
} from "@/lib/browse/sets-shared";

describe("set type filter options", () => {
  it("labels Scryfall set_type values", () => {
    expect(labelSetType("draft_innovation")).toBe("Draft Innovation");
    expect(labelSetType("commander")).toBe("Commander");
  });

  it("prepends Any type and preserves distinct values", () => {
    expect(buildSetTypeFilterOptions(["commander", "expansion"])).toEqual([
      { value: "", label: "Any type" },
      { value: "commander", label: "Commander" },
      { value: "expansion", label: "Expansion" },
    ]);
  });
});

describe("classification hide-empty options", () => {
  it("falls back to full enum when nothing is present", () => {
    expect(buildRoleFilterOptions([]).map((o) => o.value)).toContain("ramp");
    expect(buildThemeFilterOptions([]).map((o) => o.value)).toContain("tokens");
  });

  it("keeps enum order and drops empty values", () => {
    expect(buildRoleFilterOptions(["draw", "ramp"]).map((o) => o.value)).toEqual([
      "ramp",
      "draw",
    ]);
    expect(
      buildThemeFilterOptions(["tokens", "landfall"]).map((o) => o.value),
    ).toEqual(["tokens", "landfall"]);
  });

  it("always keeps the current selection", () => {
    expect(
      buildRoleFilterOptions(["ramp"], "discard").map((o) => o.value),
    ).toEqual(["ramp", "discard"]);
    expect(
      buildThemeFilterOptions(["tokens"], "mill").map((o) => o.value),
    ).toEqual(["tokens", "mill"]);
  });
});
