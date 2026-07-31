import type { PrismaClient } from "@/generated/prisma/client";

import type { DeckBoard } from "@/lib/decks/boards";
import { parseCardFaces, type CardFaceImage } from "@/lib/scryfall/faces";

/** Face tile for Tokens / Extras grids (inferred, read-only). */
export type DeckTokenFace = {
  oracleId: string;
  name: string;
  slug: string | null;
  typeLine: string;
  imageUri: string | null;
  faces: CardFaceImage[];
  component?: "token" | "extra";
};

export type DeckTokensExtras = {
  tokens: DeckTokenFace[];
  extras: DeckTokenFace[];
};

const COUNTED_ORACLE_BOARDS = new Set<string>(["main", "commander"]);

type CardImageSelect = {
  oracleId: string;
  name: string;
  slug: string | null;
  typeLine: string;
  imageUri: string | null;
  faces: unknown;
  id: string;
};

async function loadFacesForOracles(
  prisma: PrismaClient,
  oracleIds: string[],
): Promise<Map<string, DeckTokenFace>> {
  if (oracleIds.length === 0) return new Map();

  const cards = await prisma.card.findMany({
    where: { oracleId: { in: oracleIds } },
    select: {
      id: true,
      oracleId: true,
      name: true,
      slug: true,
      typeLine: true,
      imageUri: true,
      faces: true,
    },
  });

  const catalogIds = cards.map((c) => c.id);
  const printings =
    catalogIds.length > 0
      ? await prisma.printing.findMany({
          where: { id: { in: catalogIds } },
          select: { id: true, imageUri: true, faces: true },
        })
      : [];
  const printingById = new Map(printings.map((p) => [p.id, p]));

  const out = new Map<string, DeckTokenFace>();
  for (const card of cards as CardImageSelect[]) {
    const printing = printingById.get(card.id);
    out.set(card.oracleId, {
      oracleId: card.oracleId,
      name: card.name,
      slug: card.slug,
      typeLine: card.typeLine,
      imageUri: printing?.imageUri ?? card.imageUri ?? null,
      faces: parseCardFaces(printing?.faces ?? card.faces),
    });
  }
  return out;
}

function sortFaces(faces: DeckTokenFace[]): DeckTokenFace[] {
  return faces.sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
  );
}

/**
 * Distinct token / extra oracles related via Scryfall all_parts for the given
 * source oracles (typically main + commander).
 */
export async function listRelatedTokensExtrasForOracles(
  prisma: PrismaClient,
  oracleIds: string[],
): Promise<DeckTokensExtras> {
  const unique = [...new Set(oracleIds.filter(Boolean))];
  if (unique.length === 0) return { tokens: [], extras: [] };

  const relations = await prisma.cardRelation.findMany({
    where: {
      oracleId: { in: unique },
      component: { in: ["token", "extra"] },
    },
    select: {
      relatedOracleId: true,
      component: true,
      name: true,
      typeLine: true,
    },
  });

  const relatedIds = [...new Set(relations.map((r) => r.relatedOracleId))];
  const faces = await loadFacesForOracles(prisma, relatedIds);

  const tokensByOracle = new Map<string, DeckTokenFace>();
  const extrasByOracle = new Map<string, DeckTokenFace>();

  for (const rel of relations) {
    const bucket =
      rel.component === "token" ? tokensByOracle : extrasByOracle;
    if (bucket.has(rel.relatedOracleId)) continue;
    const face = faces.get(rel.relatedOracleId);
    bucket.set(rel.relatedOracleId, {
      oracleId: rel.relatedOracleId,
      name: face?.name ?? rel.name,
      slug: face?.slug ?? null,
      typeLine: face?.typeLine ?? rel.typeLine,
      imageUri: face?.imageUri ?? null,
      faces: face?.faces ?? [],
      component: rel.component,
    });
  }

  return {
    tokens: sortFaces([...tokensByOracle.values()]),
    extras: sortFaces([...extrasByOracle.values()]),
  };
}

/** Resolve stored precon token board rows into face tiles. */
export async function loadTokenFacesForRows(
  prisma: PrismaClient,
  rows: readonly {
    id?: string;
    oracleId: string;
    quantity: number;
    board: string;
  }[],
  board: "token",
): Promise<DeckTokenFace[]> {
  const filtered = rows.filter((r) => r.board === board);
  if (filtered.length === 0) return [];

  const faces = await loadFacesForOracles(
    prisma,
    filtered.map((r) => r.oracleId),
  );

  return sortFaces(
    filtered.map((row) => {
      const face = faces.get(row.oracleId);
      return {
        oracleId: row.oracleId,
        name: face?.name ?? "Unknown",
        slug: face?.slug ?? null,
        typeLine: face?.typeLine ?? "",
        imageUri: face?.imageUri ?? null,
        faces: face?.faces ?? [],
        component: "token" as const,
      };
    }),
  );
}

/** Merge inferred relations with optional precon product tokens (dedupe by oracle). */
export function mergeTokenFaces(
  inferred: DeckTokenFace[],
  product: DeckTokenFace[],
): DeckTokenFace[] {
  const byOracle = new Map<string, DeckTokenFace>();
  for (const face of [...inferred, ...product]) {
    if (!byOracle.has(face.oracleId)) {
      byOracle.set(face.oracleId, face);
    }
  }
  return sortFaces([...byOracle.values()]);
}

export function oracleIdsForTokenInference(
  cards: readonly { oracleId: string; board: DeckBoard | string }[],
): string[] {
  return cards
    .filter((c) => COUNTED_ORACLE_BOARDS.has(c.board))
    .map((c) => c.oracleId);
}
