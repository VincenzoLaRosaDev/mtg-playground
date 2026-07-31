import { describe, expect, it } from "vitest";

import { toScryfallArtCropUri } from "@/lib/scryfall/image-uri";

describe("toScryfallArtCropUri", () => {
  it("maps normal to art_crop", () => {
    expect(
      toScryfallArtCropUri(
        "https://cards.scryfall.io/normal/front/9/f/9fe237b8.jpg?1",
      ),
    ).toBe("https://cards.scryfall.io/art_crop/front/9/f/9fe237b8.jpg?1");
  });

  it("is idempotent for art_crop", () => {
    const uri = "https://cards.scryfall.io/art_crop/front/a/b/ab.jpg";
    expect(toScryfallArtCropUri(uri)).toBe(uri);
  });

  it("leaves non-Scryfall URIs alone", () => {
    expect(toScryfallArtCropUri("https://example.com/normal/x.jpg")).toBe(
      "https://example.com/normal/x.jpg",
    );
  });

  it("returns null for empty", () => {
    expect(toScryfallArtCropUri(null)).toBeNull();
  });
});
