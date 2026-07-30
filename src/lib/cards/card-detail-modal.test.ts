import { describe, expect, it } from "vitest";

import { resolveActivePrinting } from "@/lib/cards/card-detail-modal";
import type { OraclePrintingOption } from "@/lib/scryfall/card-printing";

function printing(
  partial: Partial<OraclePrintingOption> &
    Pick<OraclePrintingOption, "id" | "setCode" | "collectorNumber">,
): OraclePrintingOption {
  return {
    setName: "Test",
    rarity: "rare",
    finishes: ["nonfoil"],
    imageUri: null,
    faces: [],
    prices: null,
    ...partial,
  };
}

describe("resolveActivePrinting", () => {
  const msc = printing({
    id: "msc-211",
    setCode: "msc",
    collectorNumber: "211",
    imageUri: "https://img/msc",
  });
  const sld = printing({
    id: "sld-2807",
    setCode: "sld",
    collectorNumber: "2807",
    imageUri: "https://img/sld",
  });
  // Newest first — same order as listOraclePrintings
  const list = [sld, msc];

  it("prefers catalog printing id over newest printing", () => {
    expect(
      resolveActivePrinting(list, { catalogPrintingId: "msc-211" })?.id,
    ).toBe("msc-211");
  });

  it("prefers preferredPrintingId over catalog", () => {
    expect(
      resolveActivePrinting(list, {
        preferredPrintingId: "sld-2807",
        catalogPrintingId: "msc-211",
      })?.id,
    ).toBe("sld-2807");
  });

  it("prefers set+cn over catalog", () => {
    expect(
      resolveActivePrinting(list, {
        initialSet: "sld",
        initialCn: "2807",
        catalogPrintingId: "msc-211",
      })?.id,
    ).toBe("sld-2807");
  });

  it("falls back to catalog image uri", () => {
    expect(
      resolveActivePrinting(list, {
        catalogImageUri: "https://img/msc",
      })?.id,
    ).toBe("msc-211");
  });
});
