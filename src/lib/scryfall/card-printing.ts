import type { PrismaClient } from "@/generated/prisma/client";

import { parseCardFaces, type CardFaceImage } from "@/lib/scryfall/faces";

export type PrintingFinish = "nonfoil" | "foil" | "etched";

export type OraclePrintingOption = {
  id: string;
  setCode: string;
  setName: string;
  collectorNumber: string;
  rarity: string;
  finishes: string[];
  imageUri: string | null;
};

export type CardPrintingContext = {
  imageUri: string | null;
  faces: CardFaceImage[];
  prices: unknown;
  finishes: string[];
  setCode: string | null;
  setName: string | null;
  collectorNumber: string | null;
  printingId: string | null;
};

export function parsePrintingFinish(value: string | null | undefined): PrintingFinish | null {
  if (value === "nonfoil" || value === "foil" || value === "etched") {
    return value;
  }
  return null;
}

export function buildCardVersionSearchParams(input: {
  set?: string | null;
  cn?: string | null;
  finish?: string | null;
}): URLSearchParams {
  const params = new URLSearchParams();
  const set = input.set?.trim().toLowerCase();
  const cn = input.cn?.trim();
  const finish = parsePrintingFinish(input.finish);

  if (set) params.set("set", set);
  if (set && cn) params.set("cn", cn);
  if (finish && finish !== "nonfoil") params.set("finish", finish);
  return params;
}

export function buildCardVersionHref(
  slug: string,
  input: { set?: string | null; cn?: string | null; finish?: string | null },
): string {
  const params = buildCardVersionSearchParams(input);
  const query = params.toString();
  return query ? `/cards/${slug}?${query}` : `/cards/${slug}`;
}

export function printingOptionLabel(option: OraclePrintingOption): string {
  return `${option.setCode.toUpperCase()} #${option.collectorNumber}`;
}

export function printingOptionValue(option: OraclePrintingOption): string {
  return `${option.setCode}|${option.collectorNumber}`;
}

export function parsePrintingOptionValue(
  value: string,
): { setCode: string; collectorNumber: string } | null {
  const pipe = value.indexOf("|");
  if (pipe <= 0 || pipe === value.length - 1) {
    return null;
  }
  return {
    setCode: value.slice(0, pipe).toLowerCase(),
    collectorNumber: value.slice(pipe + 1),
  };
}

export async function listOraclePrintings(
  prisma: PrismaClient,
  oracleId: string,
): Promise<OraclePrintingOption[]> {
  const rows = await prisma.printing.findMany({
    where: { oracleId },
    select: {
      id: true,
      setCode: true,
      collectorNumber: true,
      rarity: true,
      finishes: true,
      imageUri: true,
      releasedAt: true,
      set: { select: { name: true } },
    },
    orderBy: [{ releasedAt: "desc" }, { setCode: "asc" }, { collectorNumber: "asc" }],
  });

  return rows.map((row) => ({
    id: row.id,
    setCode: row.setCode,
    setName: row.set.name,
    collectorNumber: row.collectorNumber,
    rarity: row.rarity,
    finishes: row.finishes,
    imageUri: row.imageUri,
  }));
}

/**
 * Resolve hero printing from `?set=` / `?cn=`.
 * - no set → oracle default image/faces/prices
 * - set only → lowest collector number in that set
 * - set + cn → exact printing when it matches this oracle
 */
export async function resolveCardPrinting(
  prisma: PrismaClient,
  oracleId: string,
  defaults: {
    imageUri: string | null;
    faces: unknown;
    prices: unknown;
  },
  params?: { set?: string | null; cn?: string | null },
): Promise<CardPrintingContext> {
  const setCode = params?.set?.trim().toLowerCase() || null;
  const collectorNumber = params?.cn?.trim() || null;
  const oracleFaces = parseCardFaces(defaults.faces);

  if (!setCode) {
    return {
      imageUri: defaults.imageUri,
      faces: oracleFaces,
      prices: defaults.prices,
      finishes: [],
      setCode: null,
      setName: null,
      collectorNumber: null,
      printingId: null,
    };
  }

  const printing = collectorNumber
    ? await prisma.printing.findFirst({
        where: { setCode, collectorNumber, oracleId },
        select: {
          id: true,
          imageUri: true,
          faces: true,
          prices: true,
          finishes: true,
          collectorNumber: true,
          set: { select: { name: true } },
        },
      })
    : await prisma.printing.findFirst({
        where: { setCode, oracleId },
        orderBy: { collectorNumber: "asc" },
        select: {
          id: true,
          imageUri: true,
          faces: true,
          prices: true,
          finishes: true,
          collectorNumber: true,
          set: { select: { name: true } },
        },
      });

  if (!printing) {
    const mtgSet = await prisma.mtgSet.findUnique({
      where: { code: setCode },
      select: { name: true },
    });
    return {
      imageUri: defaults.imageUri,
      faces: oracleFaces,
      prices: defaults.prices,
      finishes: [],
      setCode: mtgSet ? setCode : null,
      setName: mtgSet?.name ?? null,
      collectorNumber: null,
      printingId: null,
    };
  }

  const printingFaces = parseCardFaces(printing.faces);
  return {
    imageUri: printing.imageUri ?? defaults.imageUri,
    faces: printingFaces.length > 0 ? printingFaces : oracleFaces,
    prices: printing.prices ?? defaults.prices,
    finishes: printing.finishes,
    setCode,
    setName: printing.set.name,
    collectorNumber: printing.collectorNumber,
    printingId: printing.id,
  };
}

/** @deprecated Use resolveCardPrinting */
export async function resolveCardHeroImage(
  prisma: PrismaClient,
  oracleId: string,
  defaultImageUri: string | null,
  defaultFaces: unknown,
  setCodeParam?: string | null,
  cnParam?: string | null,
): Promise<CardPrintingContext> {
  return resolveCardPrinting(
    prisma,
    oracleId,
    { imageUri: defaultImageUri, faces: defaultFaces, prices: null },
    { set: setCodeParam, cn: cnParam },
  );
}
