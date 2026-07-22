"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import {
  assertPrintingFinish,
  listCollectionItems,
  type CollectionFilter,
  type CollectionListItem,
} from "@/lib/collection/collection";
import {
  parseCollectionImportText,
  type CollectionImportParseResult,
} from "@/lib/collection/import-parse";
import {
  listOraclePrintings,
  parsePrintingFinish,
  type OraclePrintingOption,
  type PrintingFinish,
} from "@/lib/scryfall/card-printing";

export type CollectionActionResult =
  | { ok: true }
  | { ok: false; error: string };

async function requireUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

function revalidateCollection() {
  revalidatePath("/collection");
  // Card detail SSR inventory (oracle summary under Printing).
  revalidatePath("/cards", "layout");
}

const itemKey = (userId: string, printingId: string, finish: PrintingFinish, wantlist: boolean) => ({
  userId_printingId_finish_wantlist: {
    userId,
    printingId,
    finish,
    wantlist,
  },
});

/** Upsert an owned or wish row. Quantity must be ≥ 1; use remove for delete. */
export async function upsertCollectionItem(input: {
  printingId: string;
  finish: string;
  quantity: number;
  wantlist: boolean;
}): Promise<CollectionActionResult> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: "Sign in required." };

  const finish = parsePrintingFinish(input.finish);
  if (!finish) return { ok: false, error: "Invalid finish." };

  const quantity = Math.max(0, Math.floor(input.quantity));
  if (quantity < 1) {
    return removeCollectionItemByKey({
      printingId: input.printingId,
      finish,
      wantlist: input.wantlist,
    });
  }

  const finishOk = await assertPrintingFinish(prisma, input.printingId, finish);
  if (!finishOk.ok) return finishOk;

  await prisma.collectionItem.upsert({
    where: itemKey(userId, input.printingId, finish, input.wantlist),
    create: {
      userId,
      printingId: input.printingId,
      finish,
      quantity,
      wantlist: input.wantlist,
    },
    update: { quantity },
  });

  revalidateCollection();
  return { ok: true };
}

/** Increment owned quantity by `delta` (default 1). Creates the owned row if missing. */
export async function addOwnedCopies(input: {
  printingId: string;
  finish: string;
  delta?: number;
}): Promise<CollectionActionResult> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: "Sign in required." };

  const finish = parsePrintingFinish(input.finish);
  if (!finish) return { ok: false, error: "Invalid finish." };

  const delta = Math.max(1, Math.floor(input.delta ?? 1));
  const finishOk = await assertPrintingFinish(prisma, input.printingId, finish);
  if (!finishOk.ok) return finishOk;

  const existing = await prisma.collectionItem.findUnique({
    where: itemKey(userId, input.printingId, finish, false),
  });

  await prisma.collectionItem.upsert({
    where: itemKey(userId, input.printingId, finish, false),
    create: {
      userId,
      printingId: input.printingId,
      finish,
      quantity: delta,
      wantlist: false,
    },
    update: {
      quantity: (existing?.quantity ?? 0) + delta,
    },
  });

  revalidateCollection();
  return { ok: true };
}

/** Increment wish quantity by `delta` (default 1). Creates the wish row if missing. */
export async function addWishCopies(input: {
  printingId: string;
  finish: string;
  delta?: number;
}): Promise<CollectionActionResult> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: "Sign in required." };

  const finish = parsePrintingFinish(input.finish);
  if (!finish) return { ok: false, error: "Invalid finish." };

  const delta = Math.max(1, Math.floor(input.delta ?? 1));
  const finishOk = await assertPrintingFinish(prisma, input.printingId, finish);
  if (!finishOk.ok) return finishOk;

  const existing = await prisma.collectionItem.findUnique({
    where: itemKey(userId, input.printingId, finish, true),
  });

  await prisma.collectionItem.upsert({
    where: itemKey(userId, input.printingId, finish, true),
    create: {
      userId,
      printingId: input.printingId,
      finish,
      quantity: delta,
      wantlist: true,
    },
    update: {
      quantity: (existing?.quantity ?? 0) + delta,
    },
  });

  revalidateCollection();
  return { ok: true };
}

export async function setCollectionQuantity(input: {
  id: string;
  quantity: number;
}): Promise<CollectionActionResult> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: "Sign in required." };

  const quantity = Math.max(0, Math.floor(input.quantity));
  const existing = await prisma.collectionItem.findFirst({
    where: { id: input.id, userId },
  });
  if (!existing) return { ok: false, error: "Collection item not found." };

  if (quantity < 1) {
    await prisma.collectionItem.delete({ where: { id: existing.id } });
  } else {
    await prisma.collectionItem.update({
      where: { id: existing.id },
      data: { quantity },
    });
  }

  revalidateCollection();
  return { ok: true };
}

/** From an owned tile: create wish sibling (qty 1) or remove it. */
export async function setWishSibling(input: {
  printingId: string;
  finish: string;
  onWish: boolean;
  /** Desired wish quantity when turning on (default 1). */
  quantity?: number;
}): Promise<CollectionActionResult> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: "Sign in required." };

  const finish = parsePrintingFinish(input.finish);
  if (!finish) return { ok: false, error: "Invalid finish." };

  if (!input.onWish) {
    await prisma.collectionItem.deleteMany({
      where: { userId, printingId: input.printingId, finish, wantlist: true },
    });
    revalidateCollection();
    return { ok: true };
  }

  const finishOk = await assertPrintingFinish(prisma, input.printingId, finish);
  if (!finishOk.ok) return finishOk;

  const quantity = Math.max(1, Math.floor(input.quantity ?? 1));
  const existingWish = await prisma.collectionItem.findUnique({
    where: itemKey(userId, input.printingId, finish, true),
  });
  if (!existingWish) {
    await prisma.collectionItem.create({
      data: {
        userId,
        printingId: input.printingId,
        finish,
        quantity,
        wantlist: true,
      },
    });
  }

  revalidateCollection();
  return { ok: true };
}

/** From a wish tile: move wish quantity onto owned, then delete the wish row. */
export async function obtainFromWish(input: {
  id: string;
}): Promise<CollectionActionResult> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: "Sign in required." };

  const wish = await prisma.collectionItem.findFirst({
    where: { id: input.id, userId, wantlist: true },
  });
  if (!wish) return { ok: false, error: "Wish item not found." };

  const finish = parsePrintingFinish(wish.finish);
  if (!finish) return { ok: false, error: "Invalid finish." };

  const owned = await prisma.collectionItem.findUnique({
    where: itemKey(userId, wish.printingId, finish, false),
  });

  await prisma.$transaction([
    prisma.collectionItem.upsert({
      where: itemKey(userId, wish.printingId, finish, false),
      create: {
        userId,
        printingId: wish.printingId,
        finish,
        quantity: wish.quantity,
        wantlist: false,
      },
      update: {
        quantity: (owned?.quantity ?? 0) + wish.quantity,
      },
    }),
    prisma.collectionItem.delete({ where: { id: wish.id } }),
  ]);

  revalidateCollection();
  return { ok: true };
}

export async function removeCollectionItem(input: {
  id: string;
}): Promise<CollectionActionResult> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: "Sign in required." };

  await prisma.collectionItem.deleteMany({
    where: { id: input.id, userId },
  });

  revalidateCollection();
  return { ok: true };
}

async function removeCollectionItemByKey(input: {
  printingId: string;
  finish: PrintingFinish;
  wantlist: boolean;
}): Promise<CollectionActionResult> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: "Sign in required." };

  await prisma.collectionItem.deleteMany({
    where: {
      userId,
      printingId: input.printingId,
      finish: input.finish,
      wantlist: input.wantlist,
    },
  });

  revalidateCollection();
  return { ok: true };
}

export async function getOraclePrintingsForCollection(
  oracleId: string,
): Promise<OraclePrintingOption[]> {
  return listOraclePrintings(prisma, oracleId);
}

/** Resolve printings from a catalog card id (representative printing id). */
export async function getPrintingsByCardId(
  cardId: string,
): Promise<OraclePrintingOption[] | null> {
  const card = await prisma.card.findUnique({
    where: { id: cardId },
    select: { oracleId: true },
  });
  if (!card) return null;
  return listOraclePrintings(prisma, card.oracleId);
}

export async function getCollectionSnapshot(
  filter: CollectionFilter = "all",
): Promise<CollectionListItem[]> {
  const userId = await requireUserId();
  if (!userId) return [];
  const result = await listCollectionItems(prisma, userId, filter);
  return result.items;
}

export type CollectionImportResult = {
  imported: number;
  parseErrors: CollectionImportParseResult["errors"];
  resolveErrors: { lineNumber: number; raw: string; message: string }[];
};

export async function importCollectionText(
  text: string,
): Promise<CollectionImportResult | { ok: false; error: string }> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: "Sign in required." };

  const parsed = parseCollectionImportText(text);
  const resolveErrors: CollectionImportResult["resolveErrors"] = [];
  let imported = 0;

  for (const row of parsed.rows) {
    const printing = await prisma.printing.findFirst({
      where: {
        setCode: row.setCode,
        collectorNumber: row.collectorNumber,
      },
      select: { id: true, finishes: true },
    });

    if (!printing) {
      resolveErrors.push({
        lineNumber: row.lineNumber,
        raw: row.raw,
        message: `No printing for ${row.setCode.toUpperCase()} #${row.collectorNumber}.`,
      });
      continue;
    }

    if (!printing.finishes.includes(row.finish)) {
      resolveErrors.push({
        lineNumber: row.lineNumber,
        raw: row.raw,
        message: `Finish "${row.finish}" unavailable; printing has: ${printing.finishes.join(", ") || "none"}.`,
      });
      continue;
    }

    const finish = row.finish;
    const existing = await prisma.collectionItem.findUnique({
      where: itemKey(userId, printing.id, finish, false),
    });

    const quantity = Math.max(1, row.quantity);
    await prisma.collectionItem.upsert({
      where: itemKey(userId, printing.id, finish, false),
      create: {
        userId,
        printingId: printing.id,
        finish,
        quantity,
        wantlist: false,
      },
      update: {
        quantity: (existing?.quantity ?? 0) + quantity,
      },
    });
    imported += 1;
  }

  revalidateCollection();
  return {
    imported,
    parseErrors: parsed.errors,
    resolveErrors,
  };
}
