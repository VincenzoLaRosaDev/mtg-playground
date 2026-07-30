import type { PrismaClient } from "@/generated/prisma/client";

import {
  listOracleCollectionSummary,
  toOracleCollectionSnapshot,
  type OracleCollectionSnapshot,
} from "@/lib/collection/oracle-collection";
import type { CardClassificationSummary } from "@/lib/discovery/detail-pack";
import {
  listOracleDeckSnapshot,
  type OracleDeckSnapshot,
} from "@/lib/decks/oracle-deck";
import {
  parsePrintingFinish,
  resolveActiveFinish,
  resolveOraclePrintingOption,
  type OraclePrintingOption,
  type PrintingFinish,
} from "@/lib/scryfall/card-printing";
import { parseCardFaces, type CardFaceImage } from "@/lib/scryfall/faces";

export type CardDetailModalMode = "collection" | "deck";

export type CardDetailModalPayload = {
  oracleId: string;
  cardId: string;
  slug: string;
  name: string;
  typeLine: string;
  popularityRank: number | null;
  isGameChanger: boolean;
  isReserved: boolean;
  isCommander: boolean;
  legalities: unknown;
  classification: CardClassificationSummary | null;
  /**
   * Seeded with the active printing only until Versions opens (or count ≤ 1).
   * Full list arrives via `loadCardDetailModalPrintings`.
   */
  printings: OraclePrintingOption[];
  /** True when `printings` is the complete oracle set (or there is ≤ 1 printing). */
  printingsLoaded: boolean;
  /** Total printings for this oracle (cheap count; drives Versions affordance). */
  printingCount: number;
  /** Active printing id (resolved from preferred / initial set+cn / catalog). */
  activePrintingId: string | null;
  selectedSet: string | null;
  selectedCn: string | null;
  selectedFinish: PrintingFinish;
  imageUri: string | null;
  faces: CardFaceImage[];
  prices: unknown;
  /**
   * Always null from `getCardDetailModalPayload` — filled client-side via
   * `loadCardDetailModalUserData` after open.
   */
  collection: OracleCollectionSnapshot | null;
  /** Same as `collection` — filled after open when mode is deck. */
  deck: OracleDeckSnapshot | null;
};

export type LoadCardDetailModalInput = {
  /** Catalog Card.id (search hit). */
  cardId?: string;
  slug?: string;
  oracleId?: string;
  preferredPrintingId?: string | null;
  initialSet?: string | null;
  initialCn?: string | null;
  initialFinish?: string | null;
};

export type LoadCardDetailModalUserDataInput = {
  oracleId: string;
  userId: string;
  /** When set, include deck lines for this oracle. */
  deckId?: string | null;
  /** Active printing+finish for collection snapshot active qty. */
  printingId?: string | null;
  finish?: PrintingFinish | null;
};

export type CardDetailModalUserData = {
  collection: OracleCollectionSnapshot | null;
  deck: OracleDeckSnapshot | null;
};

/** Pick active printing for the modal — mirrors PDP catalog-default rules. */
export function resolveActivePrinting(
  printings: OraclePrintingOption[],
  input: {
    preferredPrintingId?: string | null;
    initialSet?: string | null;
    initialCn?: string | null;
    /** Catalog representative = `cards.id` (usually equals that printing’s id). */
    catalogPrintingId?: string | null;
    catalogImageUri?: string | null;
  },
): OraclePrintingOption | null {
  if (printings.length === 0) return null;

  if (input.preferredPrintingId) {
    const byId = printings.find((p) => p.id === input.preferredPrintingId);
    if (byId) return byId;
  }

  const set = input.initialSet?.trim().toLowerCase();
  const cn = input.initialCn?.trim();
  if (set && cn) {
    const exact = printings.find(
      (p) => p.setCode === set && p.collectorNumber === cn,
    );
    if (exact) return exact;
  }
  if (set) {
    const inSet = printings.find((p) => p.setCode === set);
    if (inSet) return inSet;
  }

  // Same default as PDP `resolveCardPrinting`: catalog representative, not
  // `printings[0]` (list is releasedAt-desc — newest Secret Lair etc.).
  if (input.catalogPrintingId) {
    const catalog = printings.find((p) => p.id === input.catalogPrintingId);
    if (catalog) return catalog;
  }
  if (input.catalogImageUri) {
    const byImage = printings.find((p) => p.imageUri === input.catalogImageUri);
    if (byImage) return byImage;
  }

  return printings[0] ?? null;
}

/**
 * Catalog hero payload for the unified card modal (no auth / collection / deck).
 * User snapshots load separately via `getCardDetailModalUserData`.
 */
export async function getCardDetailModalPayload(
  prisma: PrismaClient,
  input: LoadCardDetailModalInput,
): Promise<CardDetailModalPayload | null> {
  let oracleId = input.oracleId?.trim() || null;

  if (!oracleId && input.cardId) {
    const row = await prisma.card.findUnique({
      where: { id: input.cardId },
      select: { oracleId: true },
    });
    oracleId = row?.oracleId ?? null;
  }

  if (!oracleId && input.slug) {
    const row = await prisma.card.findFirst({
      where: { slug: input.slug },
      select: { oracleId: true },
    });
    oracleId = row?.oracleId ?? null;
  }

  if (!oracleId) return null;

  const [card, classification] = await Promise.all([
    prisma.card.findUnique({
      where: { oracleId },
      select: {
        id: true,
        oracleId: true,
        slug: true,
        name: true,
        typeLine: true,
        imageUri: true,
        faces: true,
        popularityRank: true,
        isGameChanger: true,
        isReserved: true,
        isCommander: true,
        legalities: true,
        prices: true,
      },
    }),
    prisma.cardClassification.findUnique({
      where: { oracleId },
      select: { roles: true, themes: true, source: true },
    }),
  ]);

  if (!card?.slug) return null;

  const [active, printingCount] = await Promise.all([
    resolveOraclePrintingOption(prisma, oracleId, {
      preferredPrintingId: input.preferredPrintingId,
      initialSet: input.initialSet,
      initialCn: input.initialCn,
      catalogPrintingId: card.id,
      catalogImageUri: card.imageUri,
    }),
    prisma.printing.count({ where: { oracleId } }),
  ]);
  const printings = active ? [active] : [];
  const printingsLoaded = printingCount <= 1;
  const selectedFinish = resolveActiveFinish(
    active?.finishes ?? [],
    parsePrintingFinish(input.initialFinish),
  );

  return {
    oracleId: card.oracleId,
    cardId: card.id,
    slug: card.slug,
    name: card.name,
    typeLine: card.typeLine,
    popularityRank: card.popularityRank,
    isGameChanger: card.isGameChanger,
    isReserved: card.isReserved,
    isCommander: card.isCommander,
    legalities: card.legalities,
    classification: classification
      ? {
          roles: classification.roles,
          themes: classification.themes,
          source: classification.source,
        }
      : null,
    printings,
    printingsLoaded,
    printingCount,
    activePrintingId: active?.id ?? null,
    selectedSet: active?.setCode ?? null,
    selectedCn: active?.collectorNumber ?? null,
    selectedFinish,
    imageUri: active?.imageUri ?? card.imageUri,
    faces: active?.faces?.length ? active.faces : parseCardFaces(card.faces),
    prices: active?.prices ?? card.prices,
    collection: null,
    deck: null,
  };
}

/** Collection + optional deck snapshots after the modal hero is already open. */
export async function getCardDetailModalUserData(
  prisma: PrismaClient,
  input: LoadCardDetailModalUserDataInput,
): Promise<CardDetailModalUserData> {
  const oracleId = input.oracleId.trim();
  if (!oracleId) {
    return { collection: null, deck: null };
  }

  const finish = input.finish ?? "nonfoil";

  const [summary, deck] = await Promise.all([
    listOracleCollectionSummary(prisma, input.userId, oracleId),
    input.deckId
      ? listOracleDeckSnapshot(prisma, input.userId, input.deckId, oracleId)
      : Promise.resolve(null),
  ]);

  return {
    collection: toOracleCollectionSnapshot(
      summary,
      input.printingId ?? null,
      finish,
    ),
    deck,
  };
}

/** Recompute collection snapshot for a printing+finish without reloading printings. */
export function snapshotForPrinting(
  collection: OracleCollectionSnapshot | null,
  printingId: string | null,
  finish: PrintingFinish,
): OracleCollectionSnapshot | null {
  if (!collection) return null;
  const owned =
    printingId != null
      ? collection.rows
          .filter(
            (r) =>
              !r.wantlist && r.printingId === printingId && r.finish === finish,
          )
          .reduce((sum, r) => sum + r.quantity, 0)
      : 0;
  const wish =
    printingId != null
      ? collection.rows
          .filter(
            (r) =>
              r.wantlist && r.printingId === printingId && r.finish === finish,
          )
          .reduce((sum, r) => sum + r.quantity, 0)
      : 0;
  return {
    ...collection,
    activeOwnedQty: owned,
    activeWishQty: wish,
  };
}
