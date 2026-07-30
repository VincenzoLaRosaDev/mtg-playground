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
import { listOracleDeckSnapshot, type OracleDeckSnapshot } from "@/lib/decks/oracle-deck";
import {
  getBuildSkeleton,
  getGameChangersInCi,
  getRoleStaplesInCi,
  getSimilarCards,
  type BuildSkeletonRow,
  type DetailCardLite,
  type RoleStapleGroup,
} from "@/lib/discovery/detail-pack";
import {
  getCardRelativesBySubtype,
  type CardRelative,
} from "@/lib/scryfall/card-relatives";
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

/**
 * Deck-only snapshot refresh — avoids reloading collection + deck list when
 * the preferred deck id differs from the resolved default.
 */
export async function loadCardDetailDeckSnapshot(input: {
  oracleId: string;
  deckId: string;
}): Promise<OracleDeckSnapshot | null> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;
  const oracleId = input.oracleId.trim();
  const deckId = input.deckId.trim();
  if (!oracleId || !deckId) return null;
  return listOracleDeckSnapshot(prisma, userId, deckId, oracleId);
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

export type CardDetailListsPack = {
  similar: DetailCardLite[];
  subtypes: string[];
  relatives: CardRelative[];
  roleStaples: RoleStapleGroup[];
  gameChangers: DetailCardLite[];
  buildSkeleton: BuildSkeletonRow[];
};

/**
 * Related-card packs for the modal collapse — fetched only when opened.
 */
export async function loadCardDetailLists(input: {
  cardId: string;
  oracleId: string;
  typeLine: string;
  isCommander: boolean;
  colorIdentity: string[];
  themes: string[];
}): Promise<CardDetailListsPack> {
  const cardId = input.cardId.trim();
  const oracleId = input.oracleId.trim();
  if (!cardId || !oracleId) {
    return {
      similar: [],
      subtypes: [],
      relatives: [],
      roleStaples: [],
      gameChangers: [],
      buildSkeleton: [],
    };
  }

  const [relativesResult, similar, roleStaples, gameChangers, buildSkeleton] =
    await Promise.all([
      getCardRelativesBySubtype({ id: cardId, typeLine: input.typeLine }),
      getSimilarCards(prisma, {
        oracleId,
        colorIdentity: input.colorIdentity,
        themes: input.themes,
      }),
      input.isCommander
        ? getRoleStaplesInCi(prisma, input.colorIdentity)
        : Promise.resolve([]),
      input.isCommander
        ? getGameChangersInCi(prisma, input.colorIdentity)
        : Promise.resolve([]),
      input.isCommander
        ? getBuildSkeleton(prisma, input.colorIdentity)
        : Promise.resolve([]),
    ]);

  return {
    similar,
    subtypes: relativesResult.subtypes,
    relatives: relativesResult.relatives,
    roleStaples,
    gameChangers,
    buildSkeleton,
  };
}
