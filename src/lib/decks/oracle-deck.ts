import type { PrismaClient } from "@/generated/prisma/client";

import { boardLabel, type DeckBoard } from "@/lib/decks/boards";
import { listOwnedQtyByOracleIds } from "@/lib/decks/owned";
import {
  parsePrintingFinish,
  type PrintingFinish,
} from "@/lib/scryfall/card-printing";

export type OracleDeckRow = {
  id: string;
  board: DeckBoard;
  boardLabel: string;
  quantity: number;
  preferredPrintingId: string | null;
  setCode: string | null;
  collectorNumber: string | null;
  /** Best-effort finish from the preferred printing’s finishes list. */
  finish: PrintingFinish | null;
  ownedQty: number;
  missingQty: number;
};

export type OracleDeckSnapshot = {
  /** Copies of this oracle across all boards. */
  totalQuantity: number;
  rows: OracleDeckRow[];
};

/**
 * Deck lines for one oracle in one deck — preferred printing + owned/missing.
 */
export async function listOracleDeckSnapshot(
  prisma: PrismaClient,
  userId: string,
  deckId: string,
  oracleId: string,
): Promise<OracleDeckSnapshot | null> {
  const deck = await prisma.deck.findFirst({
    where: { id: deckId, userId },
    select: { id: true },
  });
  if (!deck) return null;

  const items = await prisma.deckCard.findMany({
    where: { deckId, oracleId },
    select: {
      id: true,
      board: true,
      quantity: true,
      preferredPrintingId: true,
      preferredPrinting: {
        select: {
          setCode: true,
          collectorNumber: true,
          finishes: true,
        },
      },
    },
    orderBy: [{ board: "asc" }, { id: "asc" }],
  });

  const ownedMap = await listOwnedQtyByOracleIds(prisma, userId, [oracleId]);
  const ownedQty = ownedMap.get(oracleId) ?? 0;
  const needed = items.reduce((sum, row) => sum + row.quantity, 0);
  const missingForOracle = Math.max(0, needed - ownedQty);

  const boardOrder: Record<string, number> = {
    commander: 0,
    companion: 1,
    main: 2,
    side: 3,
  };

  const rows: OracleDeckRow[] = items
    .map((item) => {
      const board = item.board as DeckBoard;
      const preferred = item.preferredPrinting;
      const finish =
        preferred?.finishes
          .map((value) => parsePrintingFinish(value))
          .find((value): value is PrintingFinish => value != null) ?? null;

      return {
        id: item.id,
        board,
        boardLabel: boardLabel(board),
        quantity: item.quantity,
        preferredPrintingId: item.preferredPrintingId,
        setCode: preferred?.setCode ?? null,
        collectorNumber: preferred?.collectorNumber ?? null,
        finish,
        ownedQty,
        missingQty: missingForOracle,
      };
    })
    .sort(
      (a, b) =>
        (boardOrder[a.board] ?? 9) - (boardOrder[b.board] ?? 9) ||
        a.id.localeCompare(b.id),
    );

  return {
    totalQuantity: needed,
    rows,
  };
}
