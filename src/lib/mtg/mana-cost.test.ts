import { describe, expect, it } from "vitest";

import { parseManaCost } from "@/lib/mtg/mana-cost";

describe("parseManaCost", () => {
  it("returns empty for nullish or blank", () => {
    expect(parseManaCost(null)).toEqual([]);
    expect(parseManaCost(undefined)).toEqual([]);
    expect(parseManaCost("")).toEqual([]);
  });

  it("parses standard costs", () => {
    expect(parseManaCost("{2}{W}{U}")).toEqual(["2", "W", "U"]);
    expect(parseManaCost("{X}{R}{R}")).toEqual(["X", "R", "R"]);
  });

  it("parses hybrid and phyrexian", () => {
    expect(parseManaCost("{W/U}{2/W}{B/P}")).toEqual(["W/U", "2/W", "B/P"]);
  });

  it("parses split costs in order", () => {
    expect(parseManaCost("{R/G} // {G}")).toEqual(["R/G", "G"]);
  });
});
