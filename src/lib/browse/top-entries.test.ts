import { describe, expect, it } from "vitest";

import { sortTopEntries } from "@/lib/browse/top-entries";

const rows = [
  { slug: "a", name: "A", rank: 1, numDecks: 10, inclusion: 1, salt: null },
  { slug: "b", name: "B", rank: 2, numDecks: 20, inclusion: 2, salt: 2.5 },
  { slug: "c", name: "C", rank: 3, numDecks: 30, inclusion: 3, salt: 0 },
  { slug: "d", name: "D", rank: 4, numDecks: 40, inclusion: 4, salt: 1.1 },
];

describe("sortTopEntries salt", () => {
  it("puts null salt last when sorting desc (highest first)", () => {
    const sorted = sortTopEntries(rows, "salt", "desc", (row) => row.salt);
    expect(sorted.map((row) => row.slug)).toEqual(["b", "d", "c", "a"]);
  });

  it("puts null salt last when sorting asc (lowest first)", () => {
    const sorted = sortTopEntries(rows, "salt", "asc", (row) => row.salt);
    expect(sorted.map((row) => row.slug)).toEqual(["c", "d", "b", "a"]);
  });
});
