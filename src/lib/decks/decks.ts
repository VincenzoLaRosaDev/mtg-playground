import type { PrismaClient } from "@/generated/prisma/client";

import {
  formatDeckSizeLabel,
  isCommanderLikeFormat,
  sumDeckBoardQuantities,
  type DeckBoard,
} from "@/lib/decks/boards";
import { compareDeckCardsByTypeThenCmc } from "@/lib/decks/card-type-groups";
import {
  summarizeDeckInsights,
  type DeckInsights,
} from "@/lib/decks/insights";
import {
  evaluateDeckLegality,
  type DeckLegalityIssue,
  type DeckLegalityCardInput,
} from "@/lib/decks/legality";
import {
  listOwnedQtyByOracleIds,
  summarizeDeckOwnership,
  type DeckOwnedSummary,
} from "@/lib/decks/owned";
import { parseCardFaces, type CardFaceImage } from "@/lib/scryfall/faces";
import {
  resolveActiveFinish,
  type PrintingFinish,
} from "@/lib/scryfall/card-printing";
import {
  SCRYFALL_BROWSE_FORMATS,
  type ScryfallBrowseFormat,
} from "@/lib/formats/scryfall-formats";

export type DeckListItem = {
  id: string;
  name: string;
  format: ScryfallBrowseFormat | string;
  formatLabel: string;
  /** Always `N M · S S` — commander/companion counted with main. */
  sizeLabel: string;
  updatedAt: string;
  createdAt: string;
};

export type DeckCardView = {
  id: string;
  oracleId: string;
  quantity: number;
  board: DeckBoard;
  preferredPrintingId: string | null;
  name: string;
  slug: string | null;
  typeLine: string;
  cmc: number;
  /** Scryfall mana cost string, e.g. `{2}{W}{U}`. Null for lands without a cost. */
  manaCost: string | null;
  colorIdentity: string[];
  imageUri: string | null;
  faces: CardFaceImage[];
  isCommander: boolean;
  legalities: unknown;
  prices: unknown;
  popularityRank: number | null;
  isGameChanger: boolean;
  isReserved: boolean;
  setCode: string | null;
  collectorNumber: string | null;
  finish: PrintingFinish | null;
  ownedQty: number;
  missingQty: number;
};

export type DeckDetail = {
  id: string;
  name: string;
  format: ScryfallBrowseFormat | string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  cards: DeckCardView[];
  ownership: DeckOwnedSummary;
  showCommanderBoards: boolean;
  legality: {
    ok: boolean;
    issues: DeckLegalityIssue[];
  };
  insights: DeckInsights;
};

function labelForFormat(format: string): string {
  return SCRYFALL_BROWSE_FORMATS.find((row) => row.value === format)?.label ?? format;
}

export function toLegalityCardInputs(
  cards: readonly DeckCardView[],
): DeckLegalityCardInput[] {
  return cards.map((c) => ({
    oracleId: c.oracleId,
    quantity: c.quantity,
    board: c.board,
    name: c.name,
    typeLine: c.typeLine,
    colorIdentity: c.colorIdentity,
    isCommander: c.isCommander,
    legalities: c.legalities,
  }));
}

export async function countUserDecks(
  prisma: PrismaClient,
  userId: string,
): Promise<number> {
  return prisma.deck.count({ where: { userId } });
}

export async function listDecks(
  prisma: PrismaClient,
  userId: string,
): Promise<DeckListItem[]> {
  const decks = await prisma.deck.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      format: true,
      createdAt: true,
      updatedAt: true,
      cards: { select: { quantity: true, board: true } },
    },
  });

  return decks.map((deck) => ({
    id: deck.id,
    name: deck.name,
    format: deck.format,
    formatLabel: labelForFormat(deck.format),
    sizeLabel: formatDeckSizeLabel(sumDeckBoardQuantities(deck.cards)),
    createdAt: deck.createdAt.toISOString(),
    updatedAt: deck.updatedAt.toISOString(),
  }));
}

export async function getDeckOwnedByUser(
  prisma: PrismaClient,
  userId: string,
  deckId: string,
): Promise<{ id: string; userId: string } | null> {
  return prisma.deck.findFirst({
    where: { id: deckId, userId },
    select: { id: true, userId: true },
  });
}

export async function sumDeckCardQuantity(
  prisma: PrismaClient,
  deckId: string,
): Promise<number> {
  const agg = await prisma.deckCard.aggregate({
    where: { deckId },
    _sum: { quantity: true },
  });
  return agg._sum.quantity ?? 0;
}

export async function getDeckDetail(
  prisma: PrismaClient,
  userId: string,
  deckId: string,
): Promise<DeckDetail | null> {
  const deck = await prisma.deck.findFirst({
    where: { id: deckId, userId },
    select: {
      id: true,
      name: true,
      format: true,
      notes: true,
      createdAt: true,
      updatedAt: true,
      cards: {
        select: {
          id: true,
          oracleId: true,
          quantity: true,
          board: true,
          preferredPrintingId: true,
          preferredPrinting: {
            select: {
              id: true,
              setCode: true,
              collectorNumber: true,
              imageUri: true,
              faces: true,
              prices: true,
              finishes: true,
            },
          },
        },
        orderBy: [{ board: "asc" }, { oracleId: "asc" }],
      },
    },
  });

  if (!deck) return null;

  const oracleIds = deck.cards.map((c) => c.oracleId);
  const cards =
    oracleIds.length > 0
      ? await prisma.card.findMany({
          where: { oracleId: { in: oracleIds } },
          select: {
            id: true,
            oracleId: true,
            name: true,
            slug: true,
            typeLine: true,
            cmc: true,
            manaCost: true,
            colorIdentity: true,
            imageUri: true,
            faces: true,
            isCommander: true,
            legalities: true,
            prices: true,
            popularityRank: true,
            isGameChanger: true,
            isReserved: true,
          },
        })
      : [];

  const cardByOracle = new Map(cards.map((c) => [c.oracleId, c]));
  const catalogPrintingIds = cards.map((c) => c.id);
  const catalogPrintings =
    catalogPrintingIds.length > 0
      ? await prisma.printing.findMany({
          where: { id: { in: catalogPrintingIds } },
          select: {
            id: true,
            setCode: true,
            collectorNumber: true,
            imageUri: true,
            faces: true,
            prices: true,
            finishes: true,
          },
        })
      : [];
  const catalogById = new Map(catalogPrintings.map((p) => [p.id, p]));
  const [ownedMap, classificationRows] = await Promise.all([
    listOwnedQtyByOracleIds(prisma, userId, oracleIds),
    oracleIds.length > 0
      ? prisma.cardClassification.findMany({
          where: { oracleId: { in: oracleIds } },
          select: { oracleId: true, roles: true, themes: true },
        })
      : Promise.resolve([]),
  ]);
  const classificationsByOracle = new Map(
    classificationRows.map((row) => [
      row.oracleId,
      { roles: row.roles, themes: row.themes },
    ]),
  );

  const neededByOracle = new Map<string, number>();
  for (const row of deck.cards) {
    neededByOracle.set(
      row.oracleId,
      (neededByOracle.get(row.oracleId) ?? 0) + row.quantity,
    );
  }
  const ownership = summarizeDeckOwnership(neededByOracle, ownedMap);

  // Sort display: board → type bucket → CMC → name (matches editor grids).
  const boardOrder: Record<string, number> = {
    commander: 0,
    companion: 1,
    main: 2,
    side: 3,
  };

  const cardViews: DeckCardView[] = deck.cards
    .map((row) => {
      const card = cardByOracle.get(row.oracleId);
      const preferred = row.preferredPrinting;
      const catalog = card ? catalogById.get(card.id) : undefined;
      const printing = preferred ?? catalog ?? null;
      const ownedQty = ownedMap.get(row.oracleId) ?? 0;
      const needed = neededByOracle.get(row.oracleId) ?? row.quantity;
      // Per-row missing relative to deck need for this oracle (shared across boards)
      const missingForOracle = Math.max(0, needed - ownedQty);
      const finish = printing
        ? resolveActiveFinish(printing.finishes, null)
        : null;

      return {
        id: row.id,
        oracleId: row.oracleId,
        quantity: row.quantity,
        board: row.board as DeckBoard,
        preferredPrintingId: row.preferredPrintingId ?? printing?.id ?? null,
        name: card?.name ?? "Unknown card",
        slug: card?.slug ?? null,
        typeLine: card?.typeLine ?? "",
        cmc: card?.cmc ?? 0,
        manaCost: card?.manaCost ?? null,
        colorIdentity: card?.colorIdentity ?? [],
        imageUri: printing?.imageUri ?? card?.imageUri ?? null,
        faces: parseCardFaces(printing?.faces ?? card?.faces),
        isCommander: card?.isCommander ?? false,
        legalities: card?.legalities ?? null,
        prices: printing?.prices ?? card?.prices ?? null,
        popularityRank: card?.popularityRank ?? null,
        isGameChanger: card?.isGameChanger ?? false,
        isReserved: card?.isReserved ?? false,
        setCode: printing?.setCode ?? null,
        collectorNumber: printing?.collectorNumber ?? null,
        finish,
        ownedQty,
        missingQty: missingForOracle,
      };
    })
    .sort((a, b) => {
      const bo = (boardOrder[a.board] ?? 9) - (boardOrder[b.board] ?? 9);
      if (bo !== 0) return bo;
      return compareDeckCardsByTypeThenCmc(a, b);
    });

  const legality = evaluateDeckLegality(
    deck.format,
    toLegalityCardInputs(cardViews),
  );

  const showCommanderBoards = isCommanderLikeFormat(deck.format);
  const insights = summarizeDeckInsights(
    cardViews,
    classificationsByOracle,
    { includeSkeleton: showCommanderBoards },
  );

  return {
    id: deck.id,
    name: deck.name,
    format: deck.format,
    notes: deck.notes,
    createdAt: deck.createdAt.toISOString(),
    updatedAt: deck.updatedAt.toISOString(),
    cards: cardViews,
    ownership,
    showCommanderBoards,
    legality,
    insights,
  };
}
