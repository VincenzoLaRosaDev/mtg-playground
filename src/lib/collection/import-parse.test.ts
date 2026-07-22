import { describe, expect, it } from "vitest";

import { parseCollectionImportText } from "@/lib/collection/import-parse";

describe("parseCollectionImportText", () => {
  it("parses qty,set,cn,finish CSV", () => {
    const result = parseCollectionImportText("1,MH2,240,foil\n");
    expect(result.errors).toEqual([]);
    expect(result.rows).toEqual([
      {
        lineNumber: 1,
        raw: "1,MH2,240,foil",
        setCode: "mh2",
        collectorNumber: "240",
        finish: "foil",
        quantity: 1,
      },
    ]);
  });

  it("skips header and reports bad lines", () => {
    const result = parseCollectionImportText(
      "qty,set,cn,finish\n1 MH2 240 foil\nnot-a-row\nmh2|241|nonfoil|2\n",
    );
    expect(result.rows).toHaveLength(2);
    expect(result.rows[0]?.setCode).toBe("mh2");
    expect(result.rows[0]?.collectorNumber).toBe("240");
    expect(result.rows[1]?.quantity).toBe(2);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]?.raw).toBe("not-a-row");
  });

  it("defaults finish to nonfoil", () => {
    const result = parseCollectionImportText("1,mh2,240");
    expect(result.rows[0]?.finish).toBe("nonfoil");
  });
});
