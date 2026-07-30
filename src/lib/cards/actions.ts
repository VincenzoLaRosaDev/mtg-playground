"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import {
  getCardDetailModalPayload,
  getCardDetailModalUserData,
  type CardDetailModalPayload,
  type CardDetailModalUserData,
  type LoadCardDetailModalInput,
} from "@/lib/cards/card-detail-modal";
import {
  listOraclePrintings,
  parsePrintingFinish,
  type OraclePrintingOption,
} from "@/lib/scryfall/card-printing";

/**
 * Catalog hero for the unified card detail modal (no auth / collection / deck).
 * Call `loadCardDetailModalUserData` after open for CTAs.
 */
export async function loadCardDetailModal(
  input: LoadCardDetailModalInput,
): Promise<CardDetailModalPayload | null> {
  return getCardDetailModalPayload(prisma, input);
}

/**
 * Collection + optional deck snapshots — loaded after the modal hero opens.
 */
export async function loadCardDetailModalUserData(input: {
  oracleId: string;
  deckId?: string | null;
  printingId?: string | null;
  finish?: string | null;
}): Promise<CardDetailModalUserData | null> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;

  return getCardDetailModalUserData(prisma, {
    oracleId: input.oracleId,
    userId,
    deckId: input.deckId,
    printingId: input.printingId,
    finish: parsePrintingFinish(input.finish),
  });
}

/** Full printing list for lazy VersionsBrowser / VersionPicker (modal + PDP). */
export async function loadOraclePrintings(
  oracleId: string,
): Promise<OraclePrintingOption[]> {
  const id = oracleId.trim();
  if (!id) return [];
  return listOraclePrintings(prisma, id);
}

/** @deprecated Prefer `loadOraclePrintings`. */
export async function loadCardDetailModalPrintings(
  oracleId: string,
): Promise<OraclePrintingOption[]> {
  return loadOraclePrintings(oracleId);
}
