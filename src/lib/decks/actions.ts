"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { parseDeckBoard, type DeckBoard } from "@/lib/decks/boards";
import {
  countUserDecks,
  getDeckOwnedByUser,
  sumDeckCardQuantity,
} from "@/lib/decks/decks";
import {
  mutationBlockReason,
  type DeckLegalityCardInput,
} from "@/lib/decks/legality";
import {
  MAX_DECK_CARDS,
  MAX_DECK_NAME_LENGTH,
  MAX_DECK_NOTES_LENGTH,
  MAX_PRIVATE_DECKS,
} from "@/lib/decks/limits";
import { resolveDeckPaste } from "@/lib/decks/paste-resolve";
import { isScryfallBrowseFormat } from "@/lib/formats/scryfall-formats";

export type DeckActionResult =
  | { ok: true }
  | { ok: false; error: string };

export type CreateDeckResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

async function requireUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

function revalidateDecks(deckId?: string) {
  revalidatePath("/decks");
  if (deckId) revalidatePath(`/decks/${deckId}`);
}

function normalizeName(name: string): string | null {
  const trimmed = name.trim().replace(/\s+/g, " ");
  if (!trimmed) return null;
  if (trimmed.length > MAX_DECK_NAME_LENGTH) return null;
  return trimmed;
}

function normalizeNotes(notes: string | null | undefined): string | null {
  if (notes == null) return null;
  const trimmed = notes.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, MAX_DECK_NOTES_LENGTH);
}

async function touchDeck(deckId: string) {
  await prisma.deck.update({
    where: { id: deckId },
    data: { updatedAt: new Date() },
  });
}

async function loadDeckLegalityContext(deckId: string): Promise<{
  format: string;
  cards: DeckLegalityCardInput[];
} | null> {
  const deck = await prisma.deck.findUnique({
    where: { id: deckId },
    select: {
      format: true,
      cards: {
        select: {
          oracleId: true,
          quantity: true,
          board: true,
        },
      },
    },
  });
  if (!deck) return null;

  const oracleIds = [...new Set(deck.cards.map((c) => c.oracleId))];
  const catalog =
    oracleIds.length > 0
      ? await prisma.card.findMany({
          where: { oracleId: { in: oracleIds } },
          select: {
            oracleId: true,
            name: true,
            typeLine: true,
            colorIdentity: true,
            isCommander: true,
            legalities: true,
          },
        })
      : [];
  const byOracle = new Map(catalog.map((c) => [c.oracleId, c]));

  return {
    format: deck.format,
    cards: deck.cards.map((row) => {
      const card = byOracle.get(row.oracleId);
      return {
        oracleId: row.oracleId,
        quantity: row.quantity,
        board: row.board as DeckBoard,
        name: card?.name ?? "Unknown card",
        typeLine: card?.typeLine ?? "",
        colorIdentity: card?.colorIdentity ?? [],
        isCommander: card?.isCommander ?? false,
        legalities: card?.legalities ?? null,
      };
    }),
  };
}

async function loadCardLegalityFields(oracleId: string) {
  return prisma.card.findUnique({
    where: { oracleId },
    select: {
      oracleId: true,
      name: true,
      typeLine: true,
      colorIdentity: true,
      isCommander: true,
      legalities: true,
    },
  });
}

export async function createDeck(input: {
  name: string;
  format: string;
}): Promise<CreateDeckResult> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: "Sign in required." };

  const name = normalizeName(input.name);
  if (!name) {
    return {
      ok: false,
      error: `Name is required (max ${MAX_DECK_NAME_LENGTH} characters).`,
    };
  }

  if (!isScryfallBrowseFormat(input.format)) {
    return { ok: false, error: "Invalid format." };
  }

  const count = await countUserDecks(prisma, userId);
  if (count >= MAX_PRIVATE_DECKS) {
    return {
      ok: false,
      error: `Deck limit reached (${MAX_PRIVATE_DECKS}).`,
    };
  }

  const deck = await prisma.deck.create({
    data: {
      userId,
      name,
      format: input.format,
    },
    select: { id: true },
  });

  revalidateDecks(deck.id);
  return { ok: true, id: deck.id };
}

export async function updateDeckMeta(input: {
  deckId: string;
  name?: string;
  format?: string;
  notes?: string | null;
}): Promise<DeckActionResult> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: "Sign in required." };

  const owned = await getDeckOwnedByUser(prisma, userId, input.deckId);
  if (!owned) return { ok: false, error: "Deck not found." };

  const data: { name?: string; format?: string; notes?: string | null } = {};

  if (input.name !== undefined) {
    const name = normalizeName(input.name);
    if (!name) {
      return {
        ok: false,
        error: `Name is required (max ${MAX_DECK_NAME_LENGTH} characters).`,
      };
    }
    data.name = name;
  }

  if (input.format !== undefined) {
    if (!isScryfallBrowseFormat(input.format)) {
      return { ok: false, error: "Invalid format." };
    }
    data.format = input.format;
  }

  if (input.notes !== undefined) {
    data.notes = normalizeNotes(input.notes);
  }

  if (Object.keys(data).length === 0) {
    return { ok: false, error: "Nothing to update." };
  }

  await prisma.deck.update({
    where: { id: input.deckId },
    data,
  });

  revalidateDecks(input.deckId);
  return { ok: true };
}

export async function deleteDeck(deckId: string): Promise<DeckActionResult> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: "Sign in required." };

  const result = await prisma.deck.deleteMany({
    where: { id: deckId, userId },
  });
  if (result.count === 0) return { ok: false, error: "Deck not found." };

  revalidateDecks();
  return { ok: true };
}

/**
 * Add or increment a card in a board. `cardId` is the catalog Card.id from search.
 */
export async function upsertDeckCard(input: {
  deckId: string;
  cardId?: string;
  oracleId?: string;
  board?: string;
  delta?: number;
  preferredPrintingId?: string | null;
}): Promise<DeckActionResult> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: "Sign in required." };

  const owned = await getDeckOwnedByUser(prisma, userId, input.deckId);
  if (!owned) return { ok: false, error: "Deck not found." };

  const board = parseDeckBoard(input.board ?? "main") ?? "main";
  const delta = Math.max(1, Math.floor(input.delta ?? 1));

  let oracleId = input.oracleId?.trim() || null;
  if (!oracleId && input.cardId) {
    const card = await prisma.card.findUnique({
      where: { id: input.cardId },
      select: { oracleId: true },
    });
    oracleId = card?.oracleId ?? null;
  }
  if (!oracleId) return { ok: false, error: "Card not found." };

  const cardExists = await loadCardLegalityFields(oracleId);
  if (!cardExists) return { ok: false, error: "Card not found." };

  const existing = await prisma.deckCard.findUnique({
    where: {
      deckId_oracleId_board: {
        deckId: input.deckId,
        oracleId,
        board,
      },
    },
  });

  const nextQty = (existing?.quantity ?? 0) + delta;
  const currentTotal = await sumDeckCardQuantity(prisma, input.deckId);
  const projected = currentTotal - (existing?.quantity ?? 0) + nextQty;
  if (projected > MAX_DECK_CARDS) {
    return {
      ok: false,
      error: `Deck card limit reached (${MAX_DECK_CARDS}).`,
    };
  }

  const ctx = await loadDeckLegalityContext(input.deckId);
  if (!ctx) return { ok: false, error: "Deck not found." };

  const block = mutationBlockReason({
    format: ctx.format,
    existing: ctx.cards,
    next: {
      oracleId,
      quantity: nextQty,
      board,
      name: cardExists.name,
      typeLine: cardExists.typeLine,
      colorIdentity: cardExists.colorIdentity,
      isCommander: cardExists.isCommander,
      legalities: cardExists.legalities,
    },
  });
  if (block) return { ok: false, error: block };

  if (input.preferredPrintingId) {
    const printing = await prisma.printing.findUnique({
      where: { id: input.preferredPrintingId },
      select: { oracleId: true },
    });
    if (!printing || printing.oracleId !== oracleId) {
      return { ok: false, error: "Printing does not match this card." };
    }
  }

  await prisma.deckCard.upsert({
    where: {
      deckId_oracleId_board: {
        deckId: input.deckId,
        oracleId,
        board,
      },
    },
    create: {
      deckId: input.deckId,
      oracleId,
      board,
      quantity: nextQty,
      preferredPrintingId: input.preferredPrintingId ?? null,
    },
    update: {
      quantity: nextQty,
      ...(input.preferredPrintingId
        ? { preferredPrintingId: input.preferredPrintingId }
        : {}),
    },
  });

  await touchDeck(input.deckId);
  revalidateDecks(input.deckId);
  return { ok: true };
}

export async function setDeckCardQuantity(input: {
  deckCardId: string;
  quantity: number;
}): Promise<DeckActionResult> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: "Sign in required." };

  const row = await prisma.deckCard.findFirst({
    where: { id: input.deckCardId, deck: { userId } },
    select: {
      id: true,
      deckId: true,
      quantity: true,
      oracleId: true,
      board: true,
    },
  });
  if (!row) return { ok: false, error: "Card not found in deck." };

  const quantity = Math.floor(input.quantity);
  if (quantity < 1) {
    await prisma.deckCard.delete({ where: { id: row.id } });
    await touchDeck(row.deckId);
    revalidateDecks(row.deckId);
    return { ok: true };
  }

  const currentTotal = await sumDeckCardQuantity(prisma, row.deckId);
  const projected = currentTotal - row.quantity + quantity;
  if (projected > MAX_DECK_CARDS) {
    return {
      ok: false,
      error: `Deck card limit reached (${MAX_DECK_CARDS}).`,
    };
  }

  const [ctx, card] = await Promise.all([
    loadDeckLegalityContext(row.deckId),
    loadCardLegalityFields(row.oracleId),
  ]);
  if (!ctx || !card) return { ok: false, error: "Card not found." };

  const block = mutationBlockReason({
    format: ctx.format,
    existing: ctx.cards,
    next: {
      oracleId: row.oracleId,
      quantity,
      board: row.board as DeckBoard,
      name: card.name,
      typeLine: card.typeLine,
      colorIdentity: card.colorIdentity,
      isCommander: card.isCommander,
      legalities: card.legalities,
    },
  });
  if (block) return { ok: false, error: block };

  await prisma.deckCard.update({
    where: { id: row.id },
    data: { quantity },
  });
  await touchDeck(row.deckId);
  revalidateDecks(row.deckId);
  return { ok: true };
}

export async function setPreferredPrinting(input: {
  deckCardId: string;
  printingId: string | null;
}): Promise<DeckActionResult> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: "Sign in required." };

  const row = await prisma.deckCard.findFirst({
    where: { id: input.deckCardId, deck: { userId } },
    select: { id: true, deckId: true, oracleId: true },
  });
  if (!row) return { ok: false, error: "Card not found in deck." };

  if (input.printingId) {
    const printing = await prisma.printing.findUnique({
      where: { id: input.printingId },
      select: { oracleId: true },
    });
    if (!printing || printing.oracleId !== row.oracleId) {
      return { ok: false, error: "Printing does not match this card." };
    }
  }

  await prisma.deckCard.update({
    where: { id: row.id },
    data: { preferredPrintingId: input.printingId },
  });
  await touchDeck(row.deckId);
  revalidateDecks(row.deckId);
  return { ok: true };
}

export async function removeDeckCard(
  deckCardId: string,
): Promise<DeckActionResult> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: "Sign in required." };

  const row = await prisma.deckCard.findFirst({
    where: { id: deckCardId, deck: { userId } },
    select: { id: true, deckId: true },
  });
  if (!row) return { ok: false, error: "Card not found in deck." };

  await prisma.deckCard.delete({ where: { id: row.id } });
  await touchDeck(row.deckId);
  revalidateDecks(row.deckId);
  return { ok: true };
}

export async function moveDeckCardBoard(input: {
  deckCardId: string;
  board: string;
}): Promise<DeckActionResult> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: "Sign in required." };

  const board = parseDeckBoard(input.board);
  if (!board) return { ok: false, error: "Invalid board." };

  const row = await prisma.deckCard.findFirst({
    where: { id: input.deckCardId, deck: { userId } },
    select: {
      id: true,
      deckId: true,
      oracleId: true,
      quantity: true,
      preferredPrintingId: true,
      board: true,
    },
  });
  if (!row) return { ok: false, error: "Card not found in deck." };
  if (row.board === board) return { ok: true };

  const [ctx, card] = await Promise.all([
    loadDeckLegalityContext(row.deckId),
    loadCardLegalityFields(row.oracleId),
  ]);
  if (!ctx || !card) return { ok: false, error: "Card not found." };

  const existingWithoutRow = ctx.cards.filter(
    (c) => !(c.oracleId === row.oracleId && c.board === row.board),
  );
  const targetExisting = existingWithoutRow.find(
    (c) => c.oracleId === row.oracleId && c.board === board,
  );
  const nextQty = (targetExisting?.quantity ?? 0) + row.quantity;

  const block = mutationBlockReason({
    format: ctx.format,
    existing: existingWithoutRow,
    next: {
      oracleId: row.oracleId,
      quantity: nextQty,
      board,
      name: card.name,
      typeLine: card.typeLine,
      colorIdentity: card.colorIdentity,
      isCommander: card.isCommander,
      legalities: card.legalities,
    },
  });
  if (block) return { ok: false, error: block };

  const target = await prisma.deckCard.findUnique({
    where: {
      deckId_oracleId_board: {
        deckId: row.deckId,
        oracleId: row.oracleId,
        board,
      },
    },
  });

  if (target) {
    await prisma.$transaction([
      prisma.deckCard.update({
        where: { id: target.id },
        data: {
          quantity: target.quantity + row.quantity,
          preferredPrintingId:
            target.preferredPrintingId ?? row.preferredPrintingId,
        },
      }),
      prisma.deckCard.delete({ where: { id: row.id } }),
    ]);
  } else {
    await prisma.deckCard.update({
      where: { id: row.id },
      data: { board },
    });
  }

  await touchDeck(row.deckId);
  revalidateDecks(row.deckId);
  return { ok: true };
}

export type ImportDeckPasteResult =
  | {
      ok: true;
      imported: number;
      skipped: number;
      parseErrors: { lineNumber: number; raw: string; message: string }[];
      resolveErrors: { lineNumber: number; raw: string; message: string }[];
      blockErrors: { lineNumber: number; raw: string; message: string }[];
    }
  | { ok: false; error: string };

/**
 * Replace the deck with an Arena / plain-text paste (oracle grain, no preferred printing).
 * Clears all existing deck cards first, then upserts resolved rows.
 * Lines that fail resolve or legality are reported; legal rows are written.
 */
export async function importDeckPaste(input: {
  deckId: string;
  text: string;
}): Promise<ImportDeckPasteResult> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: "Sign in required." };

  const owned = await getDeckOwnedByUser(prisma, userId, input.deckId);
  if (!owned) return { ok: false, error: "Deck not found." };

  const resolved = await resolveDeckPaste(prisma, input.text);
  if (
    resolved.rows.length === 0 &&
    resolved.parseErrors.length === 0 &&
    resolved.resolveErrors.length === 0
  ) {
    return { ok: false, error: "Paste is empty." };
  }

  // Do not wipe the deck when nothing resolved — keep current list + report errors.
  if (resolved.rows.length === 0) {
    return {
      ok: true,
      imported: 0,
      skipped: 0,
      parseErrors: resolved.parseErrors,
      resolveErrors: resolved.resolveErrors,
      blockErrors: [],
    };
  }

  const ctx = await loadDeckLegalityContext(input.deckId);
  if (!ctx) return { ok: false, error: "Deck not found." };

  await prisma.deckCard.deleteMany({ where: { deckId: input.deckId } });

  const working: DeckLegalityCardInput[] = [];
  let currentTotal = 0;
  let imported = 0;
  let skipped = 0;
  const blockErrors: {
    lineNumber: number;
    raw: string;
    message: string;
  }[] = [];

  const oracleIds = [...new Set(resolved.rows.map((r) => r.oracleId))];
  const catalogs = await prisma.card.findMany({
    where: { oracleId: { in: oracleIds } },
    select: {
      oracleId: true,
      name: true,
      typeLine: true,
      colorIdentity: true,
      isCommander: true,
      legalities: true,
    },
  });
  const catalogByOracle = new Map(catalogs.map((c) => [c.oracleId, c]));

  for (const row of resolved.rows) {
    const catalog = catalogByOracle.get(row.oracleId);
    if (!catalog) {
      blockErrors.push({
        lineNumber: row.lineNumber,
        raw: row.raw,
        message: "Card not found.",
      });
      skipped += 1;
      continue;
    }

    const existingIdx = working.findIndex(
      (c) => c.oracleId === row.oracleId && c.board === row.board,
    );
    const existingQty =
      existingIdx >= 0 ? working[existingIdx]!.quantity : 0;
    const nextQty = existingQty + row.quantity;
    const projected = currentTotal - existingQty + nextQty;
    if (projected > MAX_DECK_CARDS) {
      blockErrors.push({
        lineNumber: row.lineNumber,
        raw: row.raw,
        message: `Deck card limit reached (${MAX_DECK_CARDS}).`,
      });
      skipped += 1;
      continue;
    }

    const block = mutationBlockReason({
      format: ctx.format,
      existing: working,
      next: {
        oracleId: row.oracleId,
        quantity: nextQty,
        board: row.board,
        name: catalog.name,
        typeLine: catalog.typeLine,
        colorIdentity: catalog.colorIdentity,
        isCommander: catalog.isCommander,
        legalities: catalog.legalities,
      },
    });
    if (block) {
      blockErrors.push({
        lineNumber: row.lineNumber,
        raw: row.raw,
        message: block,
      });
      skipped += 1;
      continue;
    }

    await prisma.deckCard.upsert({
      where: {
        deckId_oracleId_board: {
          deckId: input.deckId,
          oracleId: row.oracleId,
          board: row.board,
        },
      },
      create: {
        deckId: input.deckId,
        oracleId: row.oracleId,
        board: row.board,
        quantity: nextQty,
      },
      update: { quantity: nextQty },
    });

    if (existingIdx >= 0) {
      working[existingIdx] = { ...working[existingIdx]!, quantity: nextQty };
    } else {
      working.push({
        oracleId: row.oracleId,
        quantity: nextQty,
        board: row.board,
        name: catalog.name,
        typeLine: catalog.typeLine,
        colorIdentity: catalog.colorIdentity,
        isCommander: catalog.isCommander,
        legalities: catalog.legalities,
      });
    }
    currentTotal = projected;
    imported += 1;
  }

  await touchDeck(input.deckId);
  revalidateDecks(input.deckId);

  return {
    ok: true,
    imported,
    skipped,
    parseErrors: resolved.parseErrors,
    resolveErrors: resolved.resolveErrors,
    blockErrors,
  };
}
