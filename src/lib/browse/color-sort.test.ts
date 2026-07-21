import { describe, expect, it } from "vitest";

import {
  COLOR_SORT_COLORLESS,
  COLOR_SORT_MULTICOLOR_BASE,
  COLOR_SORT_SQL_EXPRESSION,
  colorBitmask,
  computeColorSortKey,
} from "@/lib/browse/color-sort";

describe("computeColorSortKey", () => {
  it("orders mono colors WUBRG", () => {
    expect(computeColorSortKey(["W"])).toBe(100);
    expect(computeColorSortKey(["U"])).toBe(200);
    expect(computeColorSortKey(["B"])).toBe(300);
    expect(computeColorSortKey(["R"])).toBe(400);
    expect(computeColorSortKey(["G"])).toBe(500);
    expect(computeColorSortKey(["W"])).toBeLessThan(computeColorSortKey(["U"]));
    expect(computeColorSortKey(["G"])).toBeLessThan(COLOR_SORT_MULTICOLOR_BASE);
  });

  it("places multicolor after mono and before colorless", () => {
    const gu = computeColorSortKey(["G", "U"]);
    expect(gu).toBe(COLOR_SORT_MULTICOLOR_BASE + colorBitmask(["G", "U"]));
    expect(gu).toBeGreaterThan(computeColorSortKey(["G"]));
    expect(gu).toBeLessThan(COLOR_SORT_COLORLESS);
    expect(computeColorSortKey([])).toBe(COLOR_SORT_COLORLESS);
  });

  it("uses stable WUBRG bitmask for multicolor", () => {
    expect(colorBitmask(["W", "U"])).toBe(1 + 2);
    expect(colorBitmask(["W", "U", "B", "R", "G"])).toBe(31);
    expect(computeColorSortKey(["R", "G"])).toBe(
      computeColorSortKey(["G", "R"]),
    );
  });

  it("exports SQL expression aligned with JS mono/multicolor/colorless bands", () => {
    expect(COLOR_SORT_SQL_EXPRESSION).toContain("THEN 100");
    expect(COLOR_SORT_SQL_EXPRESSION).toContain("THEN 700");
    expect(COLOR_SORT_SQL_EXPRESSION).toContain("THEN 600");
    expect(COLOR_SORT_SQL_EXPRESSION).toContain("'W' = ANY(colors) THEN 1");
    expect(COLOR_SORT_SQL_EXPRESSION).toContain("'G' = ANY(colors) THEN 16");
  });
});
