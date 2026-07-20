import { describe, expect, it, vi } from "vitest";

import { findPlayableCardBySlug } from "@/lib/scryfall/catalog-filters";

describe("findPlayableCardBySlug", () => {
  it("prefers commander-legal playable cards when multiple share a slug", async () => {
    const findFirst = vi
      .fn()
      .mockResolvedValueOnce({ id: "commander-id" })
      .mockResolvedValueOnce({ id: "other-id" });

    const db = { card: { findFirst } } as unknown as Parameters<
      typeof findPlayableCardBySlug
    >[0];

    const result = await findPlayableCardBySlug(db, "atraxa-praetors-voice", {
      id: true,
    });

    expect(result).toEqual({ id: "commander-id" });
    expect(findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          slug: "atraxa-praetors-voice",
          isCommander: true,
        }),
      }),
    );
  });

  it("falls back to any playable card for the slug", async () => {
    const findFirst = vi
      .fn()
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: "sol-ring-id" });

    const db = { card: { findFirst } } as unknown as Parameters<
      typeof findPlayableCardBySlug
    >[0];

    const result = await findPlayableCardBySlug(db, "sol-ring", { id: true });

    expect(result).toEqual({ id: "sol-ring-id" });
    expect(findFirst).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        where: expect.objectContaining({
          slug: "sol-ring",
        }),
      }),
    );
  });

  it("returns null when slug is missing", async () => {
    const findFirst = vi.fn().mockResolvedValue(null);
    const db = { card: { findFirst } } as unknown as Parameters<
      typeof findPlayableCardBySlug
    >[0];

    await expect(
      findPlayableCardBySlug(db, "missing-slug", { id: true }),
    ).resolves.toBeNull();
  });
});
