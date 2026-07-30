import { describe, expect, it } from "vitest";

import {
  isMtgjsonConstructedDeckType,
  mapMtgjsonDeckToFormat,
} from "@/lib/precons/mtgjson-types";

describe("isMtgjsonConstructedDeckType", () => {
  it("allows real MTGJSON constructed type strings", () => {
    expect(isMtgjsonConstructedDeckType("Commander Deck")).toBe(true);
    expect(isMtgjsonConstructedDeckType("Challenger Deck")).toBe(true);
    expect(isMtgjsonConstructedDeckType("Duel Deck")).toBe(true);
    expect(isMtgjsonConstructedDeckType("Arena Starter Deck")).toBe(true);
  });

  it("rejects draft / jumpstart / sealed noise", () => {
    expect(isMtgjsonConstructedDeckType("Jumpstart")).toBe(false);
    expect(isMtgjsonConstructedDeckType("Secret Lair Drop")).toBe(false);
    expect(isMtgjsonConstructedDeckType("Deck Builder's Toolkit")).toBe(false);
    expect(isMtgjsonConstructedDeckType("Bundle Land Pack")).toBe(false);
    expect(isMtgjsonConstructedDeckType("Box Set")).toBe(false);
  });
});

describe("mapMtgjsonDeckToFormat", () => {
  it("maps commander-family types", () => {
    expect(mapMtgjsonDeckToFormat({ type: "Commander Deck" })).toBe("commander");
    expect(mapMtgjsonDeckToFormat({ type: "Planechase Deck" })).toBe(
      "commander",
    );
    expect(mapMtgjsonDeckToFormat({ type: "Duel Deck" })).toBe("duel");
  });

  it("maps challenger with format hints", () => {
    expect(
      mapMtgjsonDeckToFormat({
        type: "Pioneer Challenger Deck",
        name: "Pioneer Challenger 2022",
      }),
    ).toBe("pioneer");
    expect(
      mapMtgjsonDeckToFormat({
        type: "Challenger Deck",
        name: "Challenger Deck 2024",
      }),
    ).toBe("standard");
  });

  it("maps starter with commander hint", () => {
    expect(
      mapMtgjsonDeckToFormat({
        type: "Starter Deck",
        name: "Commander Starter Deck",
      }),
    ).toBe("commander");
  });
});
