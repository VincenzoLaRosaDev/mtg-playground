import { describe, expect, it } from "vitest";

import {
  buildPreconColorIdentityWhere,
  orderPreconColorIdentity,
} from "@/lib/precons/color-identity";

describe("orderPreconColorIdentity", () => {
  it("orders WUBRG and drops unknowns", () => {
    expect(orderPreconColorIdentity(["G", "B", "X", "w"])).toEqual([
      "W",
      "B",
      "G",
    ]);
  });
});

describe("buildPreconColorIdentityWhere", () => {
  it("returns empty for no colors", () => {
    expect(buildPreconColorIdentityWhere([])).toEqual({});
  });

  it("uses hasEvery for colored selections", () => {
    expect(buildPreconColorIdentityWhere(["B", "G"])).toEqual({
      colorIdentity: { hasEvery: ["B", "G"] },
    });
  });

  it("matches empty identity for colorless", () => {
    expect(buildPreconColorIdentityWhere(["C"])).toEqual({
      colorIdentity: { equals: [] },
    });
  });

  it("ORs colorless with colored when both selected", () => {
    expect(buildPreconColorIdentityWhere(["C", "U"])).toEqual({
      OR: [
        { colorIdentity: { hasEvery: ["U"] } },
        { colorIdentity: { equals: [] } },
      ],
    });
  });
});
