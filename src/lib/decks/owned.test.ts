import { describe, expect, it } from "vitest";

import { summarizeDeckOwnership } from "@/lib/decks/owned";

describe("summarizeDeckOwnership", () => {
  it("computes owned and missing copies", () => {
    const summary = summarizeDeckOwnership(
      { a: 4, b: 2, c: 1 },
      { a: 2, b: 5 },
    );
    expect(summary.ownedCopies).toBe(2 + 2 + 0);
    expect(summary.missingCopies).toBe(2 + 0 + 1);
    expect(summary.ownedByOracle).toEqual({ a: 2, b: 5, c: 0 });
  });
});
