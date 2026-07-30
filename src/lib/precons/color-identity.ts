/**
 * Denormalized precon color identity (browse filter + sync).
 * Commander board union when present; else mainboard non-land union.
 */

import type { Prisma, PrismaClient } from "@/generated/prisma/client";

import { primaryTypeGroupId } from "@/lib/decks/card-type-groups";

const COLOR_ORDER = ["W", "U", "B", "R", "G"] as const;

export function orderPreconColorIdentity(
  colors: Iterable<string>,
): string[] {
  const set = new Set(
    [...colors].map((c) => c.toUpperCase()).filter(Boolean),
  );
  return COLOR_ORDER.filter((c) => set.has(c));
}

/**
 * Filter: selected WUBRG must all appear on the precon (hasEvery).
 * `C` matches empty identity (colorless). C + colors → OR of both clauses.
 */
export function buildPreconColorIdentityWhere(
  colors: readonly string[],
): Prisma.PreconWhereInput {
  if (colors.length === 0) return {};

  const colored = colors
    .map((c) => c.toUpperCase())
    .filter((c) => c !== "C" && COLOR_ORDER.includes(c as (typeof COLOR_ORDER)[number]));
  const wantColorless = colors.some((c) => c.toUpperCase() === "C");

  const clauses: Prisma.PreconWhereInput[] = [];
  if (colored.length > 0) {
    clauses.push({ colorIdentity: { hasEvery: colored } });
  }
  if (wantColorless) {
    clauses.push({ colorIdentity: { equals: [] } });
  }
  if (clauses.length === 0) return {};
  if (clauses.length === 1) return clauses[0]!;
  return { OR: clauses };
}

export async function computeColorIdentityForPreconCards(
  prisma: PrismaClient | Prisma.TransactionClient,
  lines: readonly { oracleId: string; board: string }[],
): Promise<string[]> {
  const commanders = lines.filter((l) => l.board === "commander");
  const source =
    commanders.length > 0
      ? commanders
      : lines.filter((l) => l.board === "main");
  const oracleIds = [...new Set(source.map((l) => l.oracleId))];
  if (oracleIds.length === 0) return [];

  const cards = await prisma.card.findMany({
    where: { oracleId: { in: oracleIds } },
    select: { oracleId: true, colorIdentity: true, typeLine: true },
  });
  const byOracle = new Map(cards.map((c) => [c.oracleId, c]));
  const colors = new Set<string>();
  const useNonLands = commanders.length === 0;

  for (const line of source) {
    const card = byOracle.get(line.oracleId);
    if (!card) continue;
    if (useNonLands && primaryTypeGroupId(card.typeLine) === "land") continue;
    for (const c of card.colorIdentity) colors.add(c);
  }

  return orderPreconColorIdentity(colors);
}

/** Recompute denormalized CI for every precon (post-migrate / sync backfill). */
export async function recomputeAllPreconColorIdentities(
  prisma: PrismaClient,
): Promise<number> {
  const precons = await prisma.precon.findMany({
    select: {
      id: true,
      cards: { select: { oracleId: true, board: true } },
    },
  });

  let updated = 0;
  for (const precon of precons) {
    const colorIdentity = await computeColorIdentityForPreconCards(
      prisma,
      precon.cards,
    );
    await prisma.precon.update({
      where: { id: precon.id },
      data: { colorIdentity },
    });
    updated += 1;
  }
  return updated;
}
