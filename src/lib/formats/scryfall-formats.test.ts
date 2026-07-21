import { describe, expect, it } from "vitest";

import {
  isScryfallBrowseFormat,
  parseBrowseFormat,
  resolveFormatFromSearchParams,
  SCRYFALL_BROWSE_FORMATS,
} from "@/lib/formats/scryfall-formats";

describe("scryfall browse formats", () => {
  it("includes curated format keys", () => {
    expect(SCRYFALL_BROWSE_FORMATS.map((f) => f.value)).toContain("modern");
    expect(SCRYFALL_BROWSE_FORMATS.map((f) => f.value)).toContain("commander");
  });

  it("parses known format keys", () => {
    expect(parseBrowseFormat("Modern")).toBe("modern");
    expect(parseBrowseFormat("duel")).toBe("duel");
    expect(isScryfallBrowseFormat("pauper")).toBe(true);
  });

  it("rejects unknown keys", () => {
    expect(parseBrowseFormat("not-a-format")).toBeUndefined();
    expect(parseBrowseFormat("")).toBeUndefined();
    expect(isScryfallBrowseFormat("frontier")).toBe(false);
  });

  it("resolves format= over legacy commander=legal", () => {
    expect(resolveFormatFromSearchParams({ format: "modern", commander: "legal" })).toBe(
      "modern",
    );
    expect(resolveFormatFromSearchParams({ commander: "legal" })).toBe("commander");
    expect(resolveFormatFromSearchParams({})).toBeUndefined();
  });
});
