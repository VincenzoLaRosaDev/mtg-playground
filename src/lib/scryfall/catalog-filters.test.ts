import { describe, expect, it, vi } from "vitest";

import { findPlayableCardByEdhrecSlug } from "@/lib/scryfall/catalog-filters";

describe("findPlayableCardByEdhrecSlug", () => {
  it("prefers the commander-legal playable row when present", async () => {
    const findFirst = vi
      .fn()
      .mockResolvedValueOnce({ id: "commander-id", name: "Atraxa" })
      .mockResolvedValueOnce({ id: "other-id", name: "Atraxa Token" });

    const db = { card: { findFirst } } as unknown as Parameters<
      typeof findPlayableCardByEdhrecSlug
    >[0];
    const result = await findPlayableCardByEdhrecSlug(db, "atraxa-praetors-voice", {
      id: true,
      name: true,
    });

    expect(result).toEqual({ id: "commander-id", name: "Atraxa" });
    expect(findFirst).toHaveBeenCalledTimes(1);
    expect(findFirst.mock.calls[0]?.[0]?.where).toMatchObject({
      edhrecSlug: "atraxa-praetors-voice",
      isCommander: true,
      layout: { notIn: ["art_series"] },
    });
  });

  it("falls back to any playable row when no commander match", async () => {
    const findFirst = vi
      .fn()
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: "card-id", name: "Sol Ring" });

    const db = { card: { findFirst } } as unknown as Parameters<
      typeof findPlayableCardByEdhrecSlug
    >[0];
    const result = await findPlayableCardByEdhrecSlug(db, "sol-ring", { id: true });

    expect(result).toEqual({ id: "card-id", name: "Sol Ring" });
    expect(findFirst).toHaveBeenCalledTimes(2);
    expect(findFirst.mock.calls[1]?.[0]?.where).toMatchObject({
      edhrecSlug: "sol-ring",
      layout: { notIn: ["art_series"] },
    });
    expect(findFirst.mock.calls[1]?.[0]?.where.isCommander).toBeUndefined();
  });

  it("returns null when nothing matches", async () => {
    const findFirst = vi.fn().mockResolvedValue(null);
    const db = { card: { findFirst } } as unknown as Parameters<
      typeof findPlayableCardByEdhrecSlug
    >[0];

    await expect(
      findPlayableCardByEdhrecSlug(db, "missing-slug", { id: true }),
    ).resolves.toBeNull();
  });
});
