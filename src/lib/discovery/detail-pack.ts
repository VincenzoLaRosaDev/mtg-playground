import type { Prisma, PrismaClient } from "@/generated/prisma/client";

import { cardBrowseSelect } from "@/lib/browse/cards-filters";
import { type CardBrowseItem } from "@/lib/browse/cards-shared";
import type { FunctionalRole, SynergyTheme } from "@/lib/classification/types";
import { playableCatalogCardWhere } from "@/lib/scryfall/catalog-filters";
import { parseCatalogListPrice } from "@/lib/scryfall/card-prices";
import { parseCardFaces } from "@/lib/scryfall/faces";

export const BUILD_SKELETON_TARGETS = [
  { key: "ramp", label: "Ramp", roles: ["ramp"] as FunctionalRole[], target: 10 },
  { key: "draw", label: "Draw", roles: ["draw"] as FunctionalRole[], target: 10 },
  {
    key: "removal",
    label: "Removal",
    roles: ["removal_hard", "removal_soft"] as FunctionalRole[],
    target: 10,
  },
  { key: "counter", label: "Counter", roles: ["counter"] as FunctionalRole[], target: 5 },
  { key: "discard", label: "Discard", roles: ["discard"] as FunctionalRole[], target: 3 },
] as const;

export const BUILD_SKELETON_LANDS_NOTE = "~36 lands (informational target)";

const ROLE_STAPLE_LIMIT = 12;
const GC_IN_CI_LIMIT = 24;
const SIMILAR_LIMIT = 12;

export type DetailCardLite = CardBrowseItem;

export type CardClassificationSummary = {
  roles: string[];
  themes: string[];
  source: string;
};

export type BuildSkeletonRow = {
  key: string;
  label: string;
  target: number;
  availableInCi: number;
};

export type RoleStapleGroup = {
  role: FunctionalRole;
  label: string;
  cards: DetailCardLite[];
};

function mapBrowseRow(
  row: Prisma.CardGetPayload<{ select: typeof cardBrowseSelect }>,
): DetailCardLite {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    typeLine: row.typeLine,
    cmc: row.cmc,
    colorIdentity: row.colorIdentity,
    imageUri: row.imageUri,
    faces: parseCardFaces(row.faces),
    isCommander: row.isCommander,
    prices: row.prices,
    popularityRank: row.popularityRank,
    frictionScore: row.frictionScore,
    isGameChanger: row.isGameChanger,
    isReserved: row.isReserved,
    listPrice: parseCatalogListPrice(row.prices),
  };
}

/** Card CI ⊆ commander CI (no off-identity colors). */
export function colorIdentitySubsetWhere(
  commanderCI: string[],
): Prisma.CardWhereInput {
  const allColors = ["W", "U", "B", "R", "G"] as const;
  const forbidden = allColors.filter((color) => !commanderCI.includes(color));
  if (forbidden.length === 0) {
    return {};
  }
  return {
    AND: forbidden.map((color) => ({ NOT: { colorIdentity: { has: color } } })),
  };
}

export async function getCardClassification(
  prisma: PrismaClient,
  oracleId: string,
): Promise<CardClassificationSummary | null> {
  const row = await prisma.cardClassification.findUnique({
    where: { oracleId },
    select: { roles: true, themes: true, source: true },
  });
  if (!row) return null;
  return {
    roles: row.roles,
    themes: row.themes,
    source: row.source,
  };
}

export async function getRoleStaplesInCi(
  prisma: PrismaClient,
  commanderCI: string[],
  roles: FunctionalRole[] = [
    "ramp",
    "draw",
    "removal_hard",
    "removal_soft",
    "counter",
    "discard",
  ],
): Promise<RoleStapleGroup[]> {
  const groups: RoleStapleGroup[] = [];

  for (const role of roles) {
    const classified = await prisma.cardClassification.findMany({
      where: { roles: { has: role } },
      select: { oracleId: true },
    });
    if (classified.length === 0) {
      groups.push({ role, label: role.replaceAll("_", " "), cards: [] });
      continue;
    }

    const rows = await prisma.card.findMany({
      where: {
        ...playableCatalogCardWhere,
        oracleId: { in: classified.map((row) => row.oracleId) },
        ...colorIdentitySubsetWhere(commanderCI),
        slug: { not: null },
      },
      orderBy: [{ popularityRank: { sort: "asc", nulls: "last" } }, { name: "asc" }],
      take: ROLE_STAPLE_LIMIT,
      select: cardBrowseSelect,
    });

    groups.push({
      role,
      label: role.replaceAll("_", " "),
      cards: rows.map(mapBrowseRow),
    });
  }

  return groups;
}

export async function getGameChangersInCi(
  prisma: PrismaClient,
  commanderCI: string[],
): Promise<DetailCardLite[]> {
  const rows = await prisma.card.findMany({
    where: {
      ...playableCatalogCardWhere,
      isGameChanger: true,
      ...colorIdentitySubsetWhere(commanderCI),
      slug: { not: null },
    },
    orderBy: [{ popularityRank: { sort: "asc", nulls: "last" } }, { name: "asc" }],
    take: GC_IN_CI_LIMIT,
    select: cardBrowseSelect,
  });
  return rows.map(mapBrowseRow);
}

export async function getSimilarCards(
  prisma: PrismaClient,
  input: {
    oracleId: string;
    colorIdentity: string[];
    themes: string[];
  },
): Promise<DetailCardLite[]> {
  if (input.themes.length === 0) {
    return [];
  }

  const classified = await prisma.cardClassification.findMany({
    where: {
      oracleId: { not: input.oracleId },
      themes: { hasSome: input.themes },
    },
    select: { oracleId: true, themes: true },
    take: 200,
  });

  if (classified.length === 0) {
    return [];
  }

  const scored = classified
    .map((row) => ({
      oracleId: row.oracleId,
      overlap: row.themes.filter((theme) => input.themes.includes(theme as SynergyTheme))
        .length,
    }))
    .sort((a, b) => b.overlap - a.overlap);

  const topOracleIds = scored.slice(0, 80).map((row) => row.oracleId);
  const rows = await prisma.card.findMany({
    where: {
      ...playableCatalogCardWhere,
      oracleId: { in: topOracleIds },
      ...colorIdentitySubsetWhere(input.colorIdentity),
      slug: { not: null },
    },
    orderBy: [{ popularityRank: { sort: "asc", nulls: "last" } }, { name: "asc" }],
    take: SIMILAR_LIMIT,
    select: cardBrowseSelect,
  });

  return rows.map(mapBrowseRow);
}

export async function getBuildSkeleton(
  prisma: PrismaClient,
  commanderCI: string[],
): Promise<BuildSkeletonRow[]> {
  const rows: BuildSkeletonRow[] = [];

  for (const target of BUILD_SKELETON_TARGETS) {
    const classified = await prisma.cardClassification.findMany({
      where: {
        OR: target.roles.map((role) => ({ roles: { has: role } })),
      },
      select: { oracleId: true },
    });

    const availableInCi =
      classified.length === 0
        ? 0
        : await prisma.card.count({
            where: {
              ...playableCatalogCardWhere,
              oracleId: { in: classified.map((row) => row.oracleId) },
              ...colorIdentitySubsetWhere(commanderCI),
            },
          });

    rows.push({
      key: target.key,
      label: target.label,
      target: target.target,
      availableInCi,
    });
  }

  return rows;
}
