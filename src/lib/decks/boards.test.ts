import { describe, expect, it } from "vitest";

import {
  formatDeckSizeLabel,
  isCommanderLikeFormat,
  isDeckBoard,
  parseDeckBoard,
  sumDeckBoardQuantities,
} from "@/lib/decks/boards";

describe("deck boards", () => {
  it("accepts known boards", () => {
    expect(isDeckBoard("main")).toBe(true);
    expect(isDeckBoard("commander")).toBe(true);
    expect(parseDeckBoard(" Side ")).toBe("side");
  });

  it("rejects unknown boards", () => {
    expect(isDeckBoard("maybe")).toBe(false);
    expect(parseDeckBoard("trash")).toBeUndefined();
  });

  it("flags commander-like formats", () => {
    expect(isCommanderLikeFormat("commander")).toBe(true);
    expect(isCommanderLikeFormat("modern")).toBe(false);
  });

  it("formats size as N M · S S, folding commander into main", () => {
    expect(
      formatDeckSizeLabel(
        sumDeckBoardQuantities([
          { board: "main", quantity: 58 },
          { board: "side", quantity: 15 },
          { board: "commander", quantity: 2 },
        ]),
      ),
    ).toBe("60 M · 15 S");
    expect(
      formatDeckSizeLabel(
        sumDeckBoardQuantities([{ board: "main", quantity: 100 }]),
      ),
    ).toBe("100 M · 0 S");
  });
});
