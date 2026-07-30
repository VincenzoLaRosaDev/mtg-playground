import type { PrismaClient } from "@/generated/prisma/client";

/**
 * Batch owned quantities (wish excluded) for many oracles.
 * Used by deck editor owned/missing badges.
 */
export async function listOwnedQtyByOracleIds(
  prisma: PrismaClient,
  userId: string,
  oracleIds: string[],
): Promise<Map<string, number>> {
  const unique = [...new Set(oracleIds.filter(Boolean))];
  const result = new Map<string, number>();
  if (unique.length === 0) return result;

  const rows = await prisma.collectionItem.findMany({
    where: {
      userId,
      wantlist: false,
      quantity: { gt: 0 },
      printing: { oracleId: { in: unique } },
    },
    select: {
      quantity: true,
      printing: { select: { oracleId: true } },
    },
  });

  for (const row of rows) {
    const oracleId = row.printing.oracleId;
    result.set(oracleId, (result.get(oracleId) ?? 0) + row.quantity);
  }

  return result;
}

export type DeckOwnedSummary = {
  /** Sum of min(needed, owned) across unique oracles (copy-aware). */
  ownedCopies: number;
  /** Sum of max(0, needed - owned) across unique oracles. */
  missingCopies: number;
  /** oracleId → owned total in collection. */
  ownedByOracle: Record<string, number>;
};

/**
 * Compute owned/missing for a decklist (quantity needed per oracle is summed
 * across boards — one physical copy cannot satisfy two boards twice).
 */
export function summarizeDeckOwnership(
  neededByOracle: Map<string, number> | Record<string, number>,
  ownedByOracle: Map<string, number> | Record<string, number>,
): Omit<DeckOwnedSummary, "ownedByOracle"> & {
  ownedByOracle: Record<string, number>;
} {
  const needed =
    neededByOracle instanceof Map
      ? neededByOracle
      : new Map(Object.entries(neededByOracle));
  const owned =
    ownedByOracle instanceof Map
      ? ownedByOracle
      : new Map(Object.entries(ownedByOracle));

  let ownedCopies = 0;
  let missingCopies = 0;
  const ownedRecord: Record<string, number> = {};

  for (const [oracleId, need] of needed) {
    const have = owned.get(oracleId) ?? 0;
    ownedRecord[oracleId] = have;
    ownedCopies += Math.min(need, have);
    missingCopies += Math.max(0, need - have);
  }

  // Include owned oracles not in deck for debugging/UI completeness? No — keep deck-only.
  return { ownedCopies, missingCopies, ownedByOracle: ownedRecord };
}
