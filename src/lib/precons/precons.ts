import type { Prisma, PrismaClient } from "@/generated/prisma/client";

import {
  labelForBrowseFormat,
  parseBrowseFormat,
} from "@/lib/formats/scryfall-formats";
import {
  buildDeckStatsFromCards,
  toDeckStatsCardInput,
  type DeckStatsBundle,
} from "@/lib/decks/build-deck-stats";
import type { ManaColorKey } from "@/lib/decks/composition";
import { summarizeDeckManaPips } from "@/lib/decks/mana-pips";
import { listOwnedQtyByOracleIds, summarizeDeckOwnership } from "@/lib/decks/owned";
import {
  boardLabel,
  isCommanderLikeFormat,
  isDeckBoard,
  type DeckBoard,
} from "@/lib/decks/boards";
import {
  listRelatedTokensExtrasForOracles,
  loadTokenFacesForRows,
  mergeTokenFaces,
  oracleIdsForTokenInference,
  type DeckTokensExtras,
} from "@/lib/decks/tokens-extras";
import { buildPreconColorIdentityWhere } from "@/lib/precons/color-identity";
import { parseCardFaces, type CardFaceImage } from "@/lib/scryfall/faces";
import {
  resolveActiveFinish,
  type PrintingFinish,
} from "@/lib/scryfall/card-printing";
import { labelSetType } from "@/lib/browse/sets-shared";

/** Precon boards include product `token` lines (not a deck editor board). */
export type PreconBoard = DeckBoard | "token";

export type PreconListCostSegment = {
  key: ManaColorKey;
  weight: number;
};

export type PreconListItem = {
  id: string;
  slug: string;
  name: string;
  code: string;
  type: string;
  format: string;
  formatLabel: string;
  releaseDate: string | null;
  cardCount: number;
  /** Commander art when present; otherwise first mainboard face. */
  previewImageUri: string | null;
  previewName: string | null;
  /** Scryfall set icon for the precon `code`, when indexed. */
  setIconUri: string | null;
  /** Cost pip share segments for list preview bar. */
  costSegments: PreconListCostSegment[];
};

export type PreconCardView = {
  id: string;
  oracleId: string;
  quantity: number;
  board: PreconBoard;
  boardLabel: string;
  name: string;
  slug: string | null;
  typeLine: string;
  cmc: number;
  manaCost: string | null;
  producedMana: string[];
  colorIdentity: string[];
  rarity: string | null;
  keywords: string[];
  isGameChanger: boolean;
  imageUri: string | null;
  faces: CardFaceImage[];
  prices: unknown;
  finish: PrintingFinish | null;
  preferredPrintingId: string | null;
  setCode: string | null;
  collectorNumber: string | null;
  ownedQty: number;
  missingQty: number;
};

export type PreconDetail = {
  id: string;
  slug: string;
  name: string;
  code: string;
  type: string;
  format: string;
  formatLabel: string;
  releaseDate: string | null;
  cards: PreconCardView[];
  showCommanderBoards: boolean;
  ownership: {
    ownedCopies: number;
    missingCopies: number;
  };
  stats: DeckStatsBundle;
  tokensExtras: DeckTokensExtras;
};

export type PreconSort = "release" | "name";
export type PreconOrder = "asc" | "desc";

export type PreconTypeFilterOption = { value: string; label: string };

const PAGE_SIZE = 48;

export function parsePreconSort(value: string | null | undefined): PreconSort {
  return value === "name" ? "name" : "release";
}

export function parsePreconOrder(value: string | null | undefined): PreconOrder {
  return value === "asc" ? "asc" : "desc";
}

export function buildPreconTypeFilterOptions(
  types: string[],
): PreconTypeFilterOption[] {
  return [
    { value: "", label: "Any type" },
    ...types.map((type) => ({
      value: type,
      label: labelSetType(type),
    })),
  ];
}

export async function listDistinctPreconTypes(
  prisma: PrismaClient,
): Promise<string[]> {
  const rows = await prisma.precon.findMany({
    distinct: ["type"],
    select: { type: true },
    orderBy: { type: "asc" },
  });
  return rows.map((row) => row.type);
}

async function buildPreconSearchOr(
  prisma: PrismaClient,
  q: string,
): Promise<Prisma.PreconWhereInput[]> {
  const or: Prisma.PreconWhereInput[] = [
    { name: { contains: q, mode: "insensitive" } },
    { code: { contains: q, mode: "insensitive" } },
  ];

  const [matchingSets, matchingCommanderCards] = await Promise.all([
    prisma.mtgSet.findMany({
      where: { name: { contains: q, mode: "insensitive" } },
      select: { code: true },
      take: 200,
    }),
    prisma.card.findMany({
      where: { name: { contains: q, mode: "insensitive" } },
      select: { oracleId: true },
      take: 500,
    }),
  ]);

  if (matchingSets.length > 0) {
    const codes = [
      ...new Set(matchingSets.map((s) => s.code.trim().toLowerCase())),
    ];
    or.push({ code: { in: codes } });
  }

  if (matchingCommanderCards.length > 0) {
    or.push({
      cards: {
        some: {
          board: "commander",
          oracleId: {
            in: matchingCommanderCards.map((c) => c.oracleId),
          },
        },
      },
    });
  }

  return or;
}

export async function listPrecons(
  prisma: PrismaClient,
  input: {
    q?: string | null;
    format?: string | null;
    type?: string | null;
    colors?: string[] | null;
    sort?: PreconSort;
    order?: PreconOrder;
    cursor?: string | null;
    limit?: number;
  },
): Promise<{ items: PreconListItem[]; total: number; nextCursor: string | null }> {
  const q = input.q?.trim() ?? "";
  const format = parseBrowseFormat(input.format);
  const type = input.type?.trim().toLowerCase() || null;
  const colors = (input.colors ?? []).map((c) => c.toUpperCase()).filter(Boolean);
  const sort = input.sort ?? "release";
  const order = input.order ?? "desc";
  const limit = Math.min(100, Math.max(1, input.limit ?? PAGE_SIZE));

  const searchOr = q ? await buildPreconSearchOr(prisma, q) : null;
  const colorWhere = buildPreconColorIdentityWhere(colors);

  const and: Prisma.PreconWhereInput[] = [];
  if (format) and.push({ format });
  if (type) and.push({ type });
  if (searchOr) and.push({ OR: searchOr });
  if (Object.keys(colorWhere).length > 0) and.push(colorWhere);

  const where: Prisma.PreconWhereInput =
    and.length === 0 ? {} : and.length === 1 ? and[0]! : { AND: and };

  const orderBy =
    sort === "name"
      ? [{ name: order }, { id: order }]
      : [
          { releaseDate: { sort: order, nulls: "last" as const } },
          { name: "asc" as const },
          { id: "asc" as const },
        ];

  const [total, rows] = await Promise.all([
    prisma.precon.count({ where }),
    prisma.precon.findMany({
      where,
      orderBy,
      take: limit + 1,
      ...(input.cursor
        ? {
            skip: 1,
            cursor: { id: input.cursor },
          }
        : {}),
      select: {
        id: true,
        slug: true,
        name: true,
        code: true,
        type: true,
        format: true,
        releaseDate: true,
        _count: {
          select: {
            cards: { where: { board: { not: "token" } } },
          },
        },
      },
    }),
  ]);

  const page = rows.slice(0, limit);
  const nextCursor = rows.length > limit ? (page[page.length - 1]?.id ?? null) : null;

  const pageIds = page.map((row) => row.id);
  const [previewByPrecon, setIconByCode, costByPrecon] = await Promise.all([
    loadPreconPreviewFaces(prisma, pageIds),
    loadSetIconsByCode(
      prisma,
      page.map((row) => row.code),
    ),
    loadPreconCostSegments(prisma, pageIds),
  ]);

  return {
    total,
    nextCursor,
    items: page.map((row) => {
      const preview = previewByPrecon.get(row.id);
      return {
        id: row.id,
        slug: row.slug,
        name: row.name,
        code: row.code,
        type: row.type,
        format: row.format,
        formatLabel: labelForBrowseFormat(row.format),
        releaseDate: row.releaseDate?.toISOString() ?? null,
        cardCount: row._count.cards,
        previewImageUri: preview?.imageUri ?? null,
        previewName: preview?.name ?? null,
        setIconUri: setIconByCode.get(row.code.toLowerCase()) ?? null,
        costSegments: costByPrecon.get(row.id) ?? [],
      };
    }),
  };
}

async function loadSetIconsByCode(
  prisma: PrismaClient,
  codes: string[],
): Promise<Map<string, string | null>> {
  const unique = [
    ...new Set(codes.map((c) => c.trim().toLowerCase()).filter(Boolean)),
  ];
  const out = new Map<string, string | null>();
  if (unique.length === 0) return out;

  const sets = await prisma.mtgSet.findMany({
    where: { code: { in: unique } },
    select: { code: true, iconUri: true },
  });
  for (const set of sets) {
    out.set(set.code.toLowerCase(), set.iconUri);
  }
  return out;
}

/** Cost pip segments per precon (main+commander, lands excluded). */
async function loadPreconCostSegments(
  prisma: PrismaClient,
  preconIds: string[],
): Promise<Map<string, PreconListCostSegment[]>> {
  const out = new Map<string, PreconListCostSegment[]>();
  if (preconIds.length === 0) return out;

  const lines = await prisma.preconCard.findMany({
    where: {
      preconId: { in: preconIds },
      board: { in: ["commander", "main"] },
    },
    select: {
      preconId: true,
      board: true,
      quantity: true,
      oracleId: true,
    },
  });

  const oracleIds = [...new Set(lines.map((l) => l.oracleId))];
  const cards =
    oracleIds.length > 0
      ? await prisma.card.findMany({
          where: { oracleId: { in: oracleIds } },
          select: { oracleId: true, typeLine: true, manaCost: true },
        })
      : [];
  const cardByOracle = new Map(cards.map((c) => [c.oracleId, c]));

  const byPrecon = new Map<string, typeof lines>();
  for (const line of lines) {
    const bucket = byPrecon.get(line.preconId) ?? [];
    bucket.push(line);
    byPrecon.set(line.preconId, bucket);
  }

  for (const id of preconIds) {
    const preconLines = byPrecon.get(id) ?? [];
    const inputs = preconLines.map((line) => {
      const card = cardByOracle.get(line.oracleId);
      const board = isDeckBoard(line.board) ? line.board : "main";
      return {
        board,
        quantity: line.quantity,
        typeLine: card?.typeLine ?? "",
        manaCost: card?.manaCost ?? null,
      };
    });
    const pips = summarizeDeckManaPips(inputs);
    out.set(
      id,
      pips.buckets.map((b) => ({ key: b.key, weight: b.pips })),
    );
  }

  return out;
}

/** Prefer commander face art; fall back to first mainboard card. */
async function loadPreconPreviewFaces(
  prisma: PrismaClient,
  preconIds: string[],
): Promise<Map<string, { imageUri: string | null; name: string }>> {
  const out = new Map<string, { imageUri: string | null; name: string }>();
  if (preconIds.length === 0) return out;

  const lines = await prisma.preconCard.findMany({
    where: {
      preconId: { in: preconIds },
      board: { in: ["commander", "main"] },
    },
    select: {
      preconId: true,
      board: true,
      oracleId: true,
      preferredPrintingId: true,
    },
    orderBy: [{ board: "asc" }, { oracleId: "asc" }],
  });

  const pick = new Map<
    string,
    { oracleId: string; preferredPrintingId: string | null; board: string }
  >();
  for (const line of lines) {
    const existing = pick.get(line.preconId);
    if (!existing) {
      pick.set(line.preconId, {
        oracleId: line.oracleId,
        preferredPrintingId: line.preferredPrintingId,
        board: line.board,
      });
      continue;
    }
    // Upgrade main → commander; keep first commander if partners.
    if (existing.board !== "commander" && line.board === "commander") {
      pick.set(line.preconId, {
        oracleId: line.oracleId,
        preferredPrintingId: line.preferredPrintingId,
        board: line.board,
      });
    }
  }

  const picks = [...pick.values()];
  const oracleIds = [...new Set(picks.map((p) => p.oracleId))];
  const printingIds = picks
    .map((p) => p.preferredPrintingId)
    .filter((id): id is string => Boolean(id));

  const [cards, printings] = await Promise.all([
    oracleIds.length > 0
      ? prisma.card.findMany({
          where: { oracleId: { in: oracleIds } },
          select: { oracleId: true, name: true, imageUri: true },
        })
      : Promise.resolve([]),
    printingIds.length > 0
      ? prisma.printing.findMany({
          where: { id: { in: printingIds } },
          select: { id: true, imageUri: true },
        })
      : Promise.resolve([]),
  ]);

  const cardByOracle = new Map(cards.map((c) => [c.oracleId, c]));
  const printingById = new Map(printings.map((p) => [p.id, p]));

  for (const [preconId, face] of pick) {
    const card = cardByOracle.get(face.oracleId);
    const printing = face.preferredPrintingId
      ? printingById.get(face.preferredPrintingId)
      : null;
    out.set(preconId, {
      name: card?.name ?? "Unknown",
      imageUri: printing?.imageUri ?? card?.imageUri ?? null,
    });
  }

  return out;
}

export async function getPreconBySlug(
  prisma: PrismaClient,
  slug: string,
  userId?: string | null,
): Promise<PreconDetail | null> {
  const precon = await prisma.precon.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      name: true,
      code: true,
      type: true,
      format: true,
      releaseDate: true,
      cards: {
        select: {
          id: true,
          oracleId: true,
          quantity: true,
          board: true,
          preferredPrintingId: true,
        },
        orderBy: [{ board: "asc" }, { oracleId: "asc" }],
      },
    },
  });
  if (!precon) return null;

  const oracleIds = precon.cards.map((c) => c.oracleId);
  const [catalog, ownedMap, classificationRows] = await Promise.all([
    prisma.card.findMany({
      where: { oracleId: { in: oracleIds } },
      select: {
        oracleId: true,
        name: true,
        slug: true,
        typeLine: true,
        cmc: true,
        manaCost: true,
        producedMana: true,
        colorIdentity: true,
        keywords: true,
        isGameChanger: true,
        minRarity: true,
        imageUri: true,
        faces: true,
        prices: true,
      },
    }),
    userId
      ? listOwnedQtyByOracleIds(prisma, userId, oracleIds)
      : Promise.resolve(new Map<string, number>()),
    oracleIds.length > 0
      ? prisma.cardClassification.findMany({
          where: { oracleId: { in: oracleIds } },
          select: { oracleId: true, roles: true, themes: true },
        })
      : Promise.resolve([]),
  ]);

  const catalogByOracle = new Map(catalog.map((c) => [c.oracleId, c]));
  const classificationsByOracle = new Map(
    classificationRows.map((row) => [
      row.oracleId,
      { roles: row.roles, themes: row.themes },
    ]),
  );

  const printingIds = precon.cards
    .map((c) => c.preferredPrintingId)
    .filter((id): id is string => Boolean(id));
  const printings =
    printingIds.length > 0
      ? await prisma.printing.findMany({
          where: { id: { in: printingIds } },
          select: {
            id: true,
            setCode: true,
            collectorNumber: true,
            rarity: true,
            imageUri: true,
            faces: true,
            prices: true,
            finishes: true,
          },
        })
      : [];
  const printingById = new Map(printings.map((p) => [p.id, p]));

  const neededByOracle = new Map<string, number>();
  for (const card of precon.cards) {
    if (card.board === "token") continue;
    neededByOracle.set(
      card.oracleId,
      (neededByOracle.get(card.oracleId) ?? 0) + card.quantity,
    );
  }
  const ownership = summarizeDeckOwnership(neededByOracle, ownedMap);

  const allCards: PreconCardView[] = precon.cards.map((card) => {
    const meta = catalogByOracle.get(card.oracleId);
    const printing = card.preferredPrintingId
      ? printingById.get(card.preferredPrintingId)
      : null;
    const ownedQty = ownedMap.get(card.oracleId) ?? 0;
    const need = card.quantity;
    // Per-line missing uses oracle pool naively (same as deck row display grain).
    const missingQty = Math.max(0, need - ownedQty);
    const board = card.board as PreconBoard;
    const finish = printing
      ? resolveActiveFinish(printing.finishes, null)
      : null;

    return {
      id: card.id,
      oracleId: card.oracleId,
      quantity: card.quantity,
      board,
      boardLabel: boardLabel(board),
      name: meta?.name ?? "Unknown card",
      slug: meta?.slug ?? null,
      typeLine: meta?.typeLine ?? "",
      cmc: meta?.cmc ?? 0,
      manaCost: meta?.manaCost ?? null,
      producedMana: meta?.producedMana ?? [],
      colorIdentity: meta?.colorIdentity ?? [],
      rarity: printing?.rarity ?? meta?.minRarity ?? null,
      keywords: meta?.keywords ?? [],
      isGameChanger: meta?.isGameChanger ?? false,
      imageUri: printing?.imageUri ?? meta?.imageUri ?? null,
      faces: parseCardFaces(printing?.faces ?? meta?.faces),
      prices: printing?.prices ?? meta?.prices ?? null,
      finish,
      preferredPrintingId: card.preferredPrintingId,
      setCode: printing?.setCode ?? null,
      collectorNumber: printing?.collectorNumber ?? null,
      ownedQty,
      missingQty,
    };
  });

  const cards = allCards.filter((c) => c.board !== "token");

  // Stable display: commander → companion → main → side, then CMC → name
  const boardRank: Record<string, number> = {
    commander: 0,
    companion: 1,
    main: 2,
    side: 3,
  };
  cards.sort((a, b) => {
    const br = (boardRank[a.board] ?? 9) - (boardRank[b.board] ?? 9);
    if (br !== 0) return br;
    if (a.cmc !== b.cmc) return a.cmc - b.cmc;
    return a.name.localeCompare(b.name);
  });

  const stats = buildDeckStatsFromCards(
    precon.format,
    cards.map((card) =>
      toDeckStatsCardInput({
        ...card,
        board: card.board as DeckBoard,
      }),
    ),
    classificationsByOracle,
  );

  const [inferred, productTokens] = await Promise.all([
    listRelatedTokensExtrasForOracles(
      prisma,
      oracleIdsForTokenInference(cards),
    ),
    loadTokenFacesForRows(prisma, precon.cards, "token"),
  ]);

  return {
    id: precon.id,
    slug: precon.slug,
    name: precon.name,
    code: precon.code,
    type: precon.type,
    format: precon.format,
    formatLabel: labelForBrowseFormat(precon.format),
    releaseDate: precon.releaseDate?.toISOString() ?? null,
    cards,
    showCommanderBoards: isCommanderLikeFormat(precon.format),
    ownership: {
      ownedCopies: ownership.ownedCopies,
      missingCopies: ownership.missingCopies,
    },
    stats,
    tokensExtras: {
      tokens: mergeTokenFaces(inferred.tokens, productTokens),
      extras: inferred.extras,
    },
  };
}

