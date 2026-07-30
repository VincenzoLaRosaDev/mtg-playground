"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { countUserDecks } from "@/lib/decks/decks";
import { MAX_DECK_CARDS, MAX_PRIVATE_DECKS } from "@/lib/decks/limits";

export type ForkPreconResult =
  | { ok: true; deckId: string }
  | { ok: false; error: string };

/**
 * Copy a precon into a private Deck (oracle + preferred printing).
 * List boards only — product tokens stay inferred on the deck via relations.
 * Legality issues surface in the editor panel.
 */
export async function forkPrecon(preconId: string): Promise<ForkPreconResult> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return { ok: false, error: "Sign in to fork a precon." };
  }

  const id = preconId.trim();
  if (!id) return { ok: false, error: "Invalid precon." };

  const precon = await prisma.precon.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      format: true,
      cards: {
        select: {
          oracleId: true,
          quantity: true,
          board: true,
          preferredPrintingId: true,
        },
      },
    },
  });
  if (!precon) return { ok: false, error: "Precon not found." };
  if (precon.cards.length === 0) {
    return { ok: false, error: "This precon has no cards." };
  }

  const deckCount = await countUserDecks(prisma, userId);
  if (deckCount >= MAX_PRIVATE_DECKS) {
    return {
      ok: false,
      error: `Private deck limit reached (${MAX_PRIVATE_DECKS}).`,
    };
  }

  const listCards = precon.cards.filter((c) => c.board !== "token");
  const listQty = listCards.reduce((sum, c) => sum + c.quantity, 0);
  if (listQty > MAX_DECK_CARDS) {
    return {
      ok: false,
      error: `Precon exceeds deck card limit (${MAX_DECK_CARDS}).`,
    };
  }

  const deck = await prisma.$transaction(async (tx) => {
    const created = await tx.deck.create({
      data: {
        userId,
        name: precon.name.slice(0, 80),
        format: precon.format,
        sourcePreconId: precon.id,
      },
      select: { id: true },
    });

    if (listCards.length > 0) {
      await tx.deckCard.createMany({
        data: listCards.map((c) => ({
          deckId: created.id,
          oracleId: c.oracleId,
          quantity: c.quantity,
          board: c.board,
          preferredPrintingId: c.preferredPrintingId,
        })),
      });
    }

    return created;
  });

  revalidatePath("/decks");
  revalidatePath(`/decks/${deck.id}`);
  return { ok: true, deckId: deck.id };
}
