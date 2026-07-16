import { describe, expect, it } from "vitest";

import { decodeBrowseCursor, encodeBrowseCursor } from "@/lib/browse/cursor";
import { buildBrowseListResponse } from "@/lib/browse/response";

describe("browse cursor", () => {
  it("round-trips a payload via encode/decode", () => {
    const payload = {
      tab: "popular",
      sort: "rank",
      order: "desc",
      slug: "sol-ring",
      name: "Sol Ring",
      rank: 1,
      inclusion: 12000,
      salt: 0.5,
      numDecks: null,
    };

    const encoded = encodeBrowseCursor(payload);
    expect(encoded).toMatch(/^[A-Za-z0-9_-]+$/);

    const decoded = decodeBrowseCursor<typeof payload>(encoded);
    expect(decoded).toEqual(payload);
  });

  it("returns null for empty, invalid, or non-object cursors", () => {
    expect(decodeBrowseCursor(null)).toBeNull();
    expect(decodeBrowseCursor("")).toBeNull();
    expect(decodeBrowseCursor("   ")).toBeNull();
    expect(decodeBrowseCursor("not-base64!!!")).toBeNull();
    expect(decodeBrowseCursor(encodeBrowseCursor([] as unknown as Record<string, never>))).toBeNull();
  });

  it("buildBrowseListResponse pages and attaches nextCursor", () => {
    const rows = [
      { id: "a", name: "Alpha" },
      { id: "b", name: "Beta" },
      { id: "c", name: "Gamma" },
    ];

    const page = buildBrowseListResponse(rows, 2, 3, (item) => ({
      id: item.id,
      name: item.name,
    }));

    expect(page.items).toHaveLength(2);
    expect(page.total).toBe(3);
    expect(page.nextCursor).toBeTruthy();

    const cursor = decodeBrowseCursor<{ id: string; name: string }>(page.nextCursor);
    expect(cursor).toEqual({ id: "b", name: "Beta" });
  });

  it("omits nextCursor on the final page", () => {
    const page = buildBrowseListResponse(
      [{ id: "a", name: "Alpha" }],
      2,
      1,
      (item) => ({ id: item.id, name: item.name }),
    );

    expect(page.nextCursor).toBeNull();
  });
});
