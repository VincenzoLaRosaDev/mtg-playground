import type { PrismaClient } from "@/generated/prisma/client";

export type MtgjsonCardDeckLike = {
  name?: string;
  count?: number;
  number?: string;
  setCode?: string;
  isFoil?: boolean;
  finishes?: string[];
  identifiers?: {
    scryfallOracleId?: string;
    scryfallId?: string;
  };
};

export type PreconSyncBoard =
  | "main"
  | "side"
  | "commander"
  | "companion"
  | "token";

export type ResolvedPreconCardLine = {
  oracleId: string;
  quantity: number;
  board: PreconSyncBoard;
  preferredPrintingId: string | null;
};

const TOKEN_LAYOUTS = ["token", "double_faced_token", "emblem"] as const;

function preferredFinish(card: MtgjsonCardDeckLike): string {
  if (card.finishes?.includes("etched")) return "etched";
  if (card.isFoil || card.finishes?.includes("foil")) return "foil";
  return "nonfoil";
}

/**
 * Resolve MTGJSON CardDeck → oracle + optional preferred printing in our DB.
 */
export async function resolveMtgjsonCardDeck(
  prisma: PrismaClient,
  card: MtgjsonCardDeckLike,
  board: PreconSyncBoard,
): Promise<ResolvedPreconCardLine | null> {
  const quantity = Math.max(1, Math.floor(Number(card.count) || 1));
  let oracleId = card.identifiers?.scryfallOracleId?.trim() || null;
  const scryfallId = card.identifiers?.scryfallId?.trim() || null;
  const setCode = card.setCode?.trim().toLowerCase() || null;
  const collectorNumber = card.number?.trim() || null;
  const preferTokenLayout = board === "token";

  let preferredPrintingId: string | null = null;

  if (scryfallId) {
    const printing = await prisma.printing.findUnique({
      where: { id: scryfallId },
      select: { id: true, oracleId: true, finishes: true },
    });
    if (printing) {
      preferredPrintingId = printing.id;
      oracleId = oracleId ?? printing.oracleId;
    }
  }

  if (!preferredPrintingId && setCode && collectorNumber) {
    const printing = await prisma.printing.findUnique({
      where: {
        setCode_collectorNumber: {
          setCode,
          collectorNumber,
        },
      },
      select: { id: true, oracleId: true, finishes: true },
    });
    if (printing) {
      preferredPrintingId = printing.id;
      oracleId = oracleId ?? printing.oracleId;
    }
  }

  if (!oracleId) {
    const name = card.name?.trim();
    if (!name) return null;
    const byName = preferTokenLayout
      ? await prisma.card.findFirst({
          where: {
            name: { equals: name, mode: "insensitive" },
            layout: { in: [...TOKEN_LAYOUTS] },
          },
          select: { oracleId: true },
        })
      : null;
    const fallback =
      byName ??
      (await prisma.card.findFirst({
        where: { name: { equals: name, mode: "insensitive" } },
        select: { oracleId: true },
      }));
    oracleId = fallback?.oracleId ?? null;
  }

  if (!oracleId) return null;

  // Prefer a printing that exists and supports the finish when we only have oracle.
  if (!preferredPrintingId && setCode && collectorNumber) {
    // already tried
  } else if (!preferredPrintingId && setCode) {
    const finish = preferredFinish(card);
    const printing = await prisma.printing.findFirst({
      where: {
        oracleId,
        setCode,
        finishes: { has: finish },
      },
      orderBy: { releasedAt: "desc" },
      select: { id: true },
    });
    preferredPrintingId = printing?.id ?? null;
  }

  return {
    oracleId,
    quantity,
    board,
    preferredPrintingId,
  };
}
