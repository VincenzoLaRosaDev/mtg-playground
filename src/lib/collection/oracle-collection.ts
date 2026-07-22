import type { PrismaClient } from "@/generated/prisma/client";
import {
  parsePrintingFinish,
  type PrintingFinish,
} from "@/lib/scryfall/card-printing";

export type OracleCollectionRow = {
  id: string;
  printingId: string;
  finish: PrintingFinish;
  quantity: number;
  wantlist: boolean;
  setCode: string;
  collectorNumber: string;
  setName: string;
};

export type OracleCollectionSummary = {
  ownedTotal: number;
  wishTotal: number;
  rows: OracleCollectionRow[];
  /** Owned qty for a specific printing+finish (0 if none). */
  ownedQtyFor: (printingId: string, finish: PrintingFinish) => number;
  /** Wish qty for a specific printing+finish (0 if none). */
  wishQtyFor: (printingId: string, finish: PrintingFinish) => number;
};

function pairKey(printingId: string, finish: string, wantlist: boolean): string {
  return `${printingId}\0${finish}\0${wantlist ? "1" : "0"}`;
}

/**
 * User inventory for one oracle card — owned and wish rows across all printings.
 */
export async function listOracleCollectionSummary(
  prisma: PrismaClient,
  userId: string,
  oracleId: string,
): Promise<OracleCollectionSummary> {
  const items = await prisma.collectionItem.findMany({
    where: {
      userId,
      quantity: { gt: 0 },
      printing: { oracleId },
    },
    select: {
      id: true,
      printingId: true,
      finish: true,
      quantity: true,
      wantlist: true,
      printing: {
        select: {
          setCode: true,
          collectorNumber: true,
          set: { select: { name: true } },
        },
      },
    },
    orderBy: [
      { printing: { setCode: "asc" } },
      { printing: { collectorNumber: "asc" } },
      { finish: "asc" },
      { wantlist: "asc" },
    ],
  });

  const qtyByKey = new Map<string, number>();
  const rows: OracleCollectionRow[] = [];
  let ownedTotal = 0;
  let wishTotal = 0;

  for (const item of items) {
    const finish = parsePrintingFinish(item.finish);
    if (!finish) continue;

    qtyByKey.set(pairKey(item.printingId, finish, item.wantlist), item.quantity);
    if (item.wantlist) wishTotal += item.quantity;
    else ownedTotal += item.quantity;

    rows.push({
      id: item.id,
      printingId: item.printingId,
      finish,
      quantity: item.quantity,
      wantlist: item.wantlist,
      setCode: item.printing.setCode,
      collectorNumber: item.printing.collectorNumber,
      setName: item.printing.set.name,
    });
  }

  return {
    ownedTotal,
    wishTotal,
    rows,
    ownedQtyFor: (printingId, finish) =>
      qtyByKey.get(pairKey(printingId, finish, false)) ?? 0,
    wishQtyFor: (printingId, finish) =>
      qtyByKey.get(pairKey(printingId, finish, true)) ?? 0,
  };
}

/** Serializable snapshot for client components (no functions). */
export type OracleCollectionSnapshot = {
  ownedTotal: number;
  wishTotal: number;
  rows: OracleCollectionRow[];
  activeOwnedQty: number;
  activeWishQty: number;
};

export function toOracleCollectionSnapshot(
  summary: OracleCollectionSummary,
  printingId: string | null,
  finish: PrintingFinish,
): OracleCollectionSnapshot {
  return {
    ownedTotal: summary.ownedTotal,
    wishTotal: summary.wishTotal,
    rows: summary.rows,
    activeOwnedQty:
      printingId != null ? summary.ownedQtyFor(printingId, finish) : 0,
    activeWishQty:
      printingId != null ? summary.wishQtyFor(printingId, finish) : 0,
  };
}
