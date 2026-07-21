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

const PRINTING_SELECT = {
  id: true,
  imageUri: true,
  faces: true,
  prices: true,
  finishes: true,
  collectorNumber: true,
  setCode: true,
  set: { select: { name: true } },
} as const;

export function parsePrintingFinish(value: string | null | undefined): PrintingFinish | null {
  if (value === "nonfoil" || value === "foil" || value === "etched") {
    return value;
  }
  return null;
}

/** Active finish for UI: prefer URL param, else nonfoil, else first available. */
export function resolveActiveFinish(
  finishes: string[],
  selectedFinish: PrintingFinish | null,
): PrintingFinish {
  const options = finishes.filter(
    (finish): finish is PrintingFinish =>
      finish === "nonfoil" || finish === "foil" || finish === "etched",
  );
  if (selectedFinish && options.includes(selectedFinish)) {
    return selectedFinish;
  }
  if (options.includes("nonfoil")) {
    return "nonfoil";
  }
  return options[0] ?? "nonfoil";
}

export type CardDetailView = "card" | "commander";

/** Active list view: commander only when legal and `?view=commander`. */
export function resolveCardDetailView(
  isCommander: boolean,
  view: string | null | undefined,
): CardDetailView {
  return isCommander && view === "commander" ? "commander" : "card";
}

export function buildCardVersionSearchParams(input: {
  set?: string | null;
  cn?: string | null;
  finish?: string | null;
  /** Omit or `"card"` → no query param; `"commander"` → `view=commander`. */
  view?: CardDetailView | null;
}): URLSearchParams {
  const params = new URLSearchParams();
  const set = input.set?.trim().toLowerCase();
  const cn = input.cn?.trim();
  const finish = parsePrintingFinish(input.finish);

  if (set) params.set("set", set);
  if (set && cn) params.set("cn", cn);
  if (finish && finish !== "nonfoil") params.set("finish", finish);
  if (input.view === "commander") params.set("view", "commander");
  return params;
}

export function buildCardVersionHref(
  slug: string,
  input: {
    set?: string | null;
    cn?: string | null;
    finish?: string | null;
    view?: CardDetailView | null;
  },
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

type PrintingRow = {
  id: string;
  imageUri: string | null;
  faces: unknown;
  prices: unknown;
  finishes: string[];
  collectorNumber: string;
  setCode: string;
  set: { name: string };
};

function toPrintingContext(
  printing: PrintingRow,
  defaults: { imageUri: string | null; faces: CardFaceImage[]; prices: unknown },
): CardPrintingContext {
  const printingFaces = parseCardFaces(printing.faces);
  return {
    imageUri: printing.imageUri ?? defaults.imageUri,
    faces: printingFaces.length > 0 ? printingFaces : defaults.faces,
    prices: printing.prices ?? defaults.prices,
    finishes: printing.finishes,
    setCode: printing.setCode,
    setName: printing.set.name,
    collectorNumber: printing.collectorNumber,
    printingId: printing.id,
  };
}

/**
 * Catalog default = oracle representative printing (`cards.id` === `printings.id`),
 * falling back to an imageUri match on the same oracle.
 */
async function findCatalogDefaultPrinting(
  prisma: PrismaClient,
  oracleId: string,
  catalogPrintingId: string | null | undefined,
  imageUri: string | null,
): Promise<PrintingRow | null> {
  if (catalogPrintingId) {
    const byId = await prisma.printing.findFirst({
      where: { id: catalogPrintingId, oracleId },
      select: PRINTING_SELECT,
    });
    if (byId) return byId;
  }

  if (imageUri) {
    return prisma.printing.findFirst({
      where: { oracleId, imageUri },
      orderBy: [{ releasedAt: "desc" }, { collectorNumber: "asc" }],
      select: PRINTING_SELECT,
    });
  }

  return null;
}

/**
 * Resolve hero printing from `?set=` / `?cn=`.
 * - no set → catalog default printing (Card.id / imageUri match); still returns set/cn
 * - set only → lowest collector number in that set
 * - set + cn → exact printing when it matches this oracle
 */
export async function resolveCardPrinting(
  prisma: PrismaClient,
  oracleId: string,
  defaults: {
    /** Scryfall id of the oracle representative (`cards.id`). */
    catalogPrintingId?: string | null;
    imageUri: string | null;
    faces: unknown;
    prices: unknown;
  },
  params?: { set?: string | null; cn?: string | null },
): Promise<CardPrintingContext> {
  const setCode = params?.set?.trim().toLowerCase() || null;
  const collectorNumber = params?.cn?.trim() || null;
  const oracleFaces = parseCardFaces(defaults.faces);
  const fallback = {
    imageUri: defaults.imageUri,
    faces: oracleFaces,
    prices: defaults.prices,
  };

  if (!setCode) {
    const catalog = await findCatalogDefaultPrinting(
      prisma,
      oracleId,
      defaults.catalogPrintingId,
      defaults.imageUri,
    );
    if (catalog) {
      return toPrintingContext(catalog, fallback);
    }
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
        select: PRINTING_SELECT,
      })
    : await prisma.printing.findFirst({
        where: { setCode, oracleId },
        orderBy: { collectorNumber: "asc" },
        select: PRINTING_SELECT,
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

  return toPrintingContext(printing, fallback);
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
