import { describe, expect, it } from "vitest";

import {
  canFlipFaces,
  flipFaceUris,
  parseCardFaces,
} from "@/lib/scryfall/faces";

describe("parseCardFaces", () => {
  it("parses stored face JSON", () => {
    const faces = parseCardFaces([
      { name: "Front", imageUri: "https://example.com/front.jpg" },
      { name: "Back", imageUri: "https://example.com/back.jpg" },
    ]);
    expect(faces).toHaveLength(2);
    expect(faces[0]?.name).toBe("Front");
  });

  it("returns empty for invalid input", () => {
    expect(parseCardFaces(null)).toEqual([]);
    expect(parseCardFaces({})).toEqual([]);
  });
});

describe("flipFaceUris", () => {
  it("requires two image uris to flip", () => {
    expect(
      canFlipFaces([
        { name: "A", imageUri: "https://a" },
        { name: "B", imageUri: "https://b" },
      ]),
    ).toBe(true);
    expect(canFlipFaces([{ name: "A", imageUri: "https://a" }])).toBe(false);
    expect(flipFaceUris([{ name: "A", imageUri: null }], "https://fallback")).toEqual([
      "https://fallback",
    ]);
  });
});
