import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { gunzipSync } from "node:zlib";
import { config } from "dotenv";

import { SyncSource, SyncStatus } from "../../src/generated/prisma/client";
import type { PrismaClient } from "../../src/generated/prisma/client";
import {
  computeColorIdentityForPreconCards,
  recomputeAllPreconColorIdentities,
} from "../../src/lib/precons/color-identity";
import {
  isMtgjsonConstructedDeckType,
  mapMtgjsonDeckToFormat,
} from "../../src/lib/precons/mtgjson-types";
import {
  resolveMtgjsonCardDeck,
  type MtgjsonCardDeckLike,
} from "../../src/lib/precons/resolve-mtgjson-card";
import { toPreconSlug } from "../../src/lib/precons/slug";

config({ path: ".env.local" });
config({ path: ".env" });

const USER_AGENT = "MTGPlayground/1.0";
const JOB_TYPE = "precons";
const DECK_LIST_URL = "https://mtgjson.com/api/v5/DeckList.json.gz";
const DECK_FILE_URL = (fileName: string) =>
  `https://mtgjson.com/api/v5/decks/${encodeURIComponent(fileName)}.json`;
const FETCH_CONCURRENCY = 6;

type DeckListEntry = {
  code: string;
  fileName: string;
  name: string;
  releaseDate: string | null;
  type: string;
};

type DeckListFile = {
  meta?: { date?: string; version?: string };
  data: DeckListEntry[];
};

type MtgjsonDeckFile = {
  data?: {
    code?: string;
    name?: string;
    type?: string;
    releaseDate?: string | null;
    commander?: MtgjsonCardDeckLike[];
    mainBoard?: MtgjsonCardDeckLike[];
    sideBoard?: MtgjsonCardDeckLike[];
    tokens?: MtgjsonCardDeckLike[];
  };
  // Some payloads are unwrapped
  code?: string;
  name?: string;
  type?: string;
  releaseDate?: string | null;
  commander?: MtgjsonCardDeckLike[];
  mainBoard?: MtgjsonCardDeckLike[];
  sideBoard?: MtgjsonCardDeckLike[];
  tokens?: MtgjsonCardDeckLike[];
};

function parseArgs() {
  return {
    ifChanged: process.argv.includes("--if-changed"),
    limit: (() => {
      const idx = process.argv.indexOf("--limit");
      if (idx < 0) return null;
      const n = Number(process.argv[idx + 1]);
      return Number.isFinite(n) && n > 0 ? Math.floor(n) : null;
    })(),
  };
}

async function getLastMetaDate(prisma: PrismaClient): Promise<string | null> {
  const last = await prisma.syncLog.findFirst({
    where: {
      source: SyncSource.MTGJSON,
      jobType: JOB_TYPE,
      status: SyncStatus.SUCCESS,
    },
    orderBy: { completedAt: "desc" },
    select: { errors: true },
  });
  if (!last?.errors || typeof last.errors !== "object" || Array.isArray(last.errors)) {
    return null;
  }
  const metaDate = (last.errors as Record<string, unknown>).metaDate;
  return typeof metaDate === "string" ? metaDate : null;
}

async function fetchJsonGz(url: string): Promise<unknown> {
  const response = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": USER_AGENT },
  });
  if (!response.ok) {
    throw new Error(`MTGJSON fetch failed ${response.status}: ${url}`);
  }
  const buf = Buffer.from(await response.arrayBuffer());
  const text = gunzipSync(buf).toString("utf8");
  return JSON.parse(text) as unknown;
}

async function fetchDeckFile(fileName: string): Promise<MtgjsonDeckFile> {
  const response = await fetch(DECK_FILE_URL(fileName), {
    headers: { Accept: "application/json", "User-Agent": USER_AGENT },
  });
  if (!response.ok) {
    throw new Error(`Deck fetch failed ${response.status}: ${fileName}`);
  }
  return (await response.json()) as MtgjsonDeckFile;
}

function unwrapDeck(raw: MtgjsonDeckFile) {
  return raw.data ?? raw;
}

async function mapPool<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next;
      next += 1;
      results[i] = await fn(items[i]!, i);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () => worker()),
  );
  return results;
}

async function ensureUniqueSlug(
  prisma: PrismaClient,
  base: string,
  mtgjsonFileName: string,
): Promise<string> {
  const existing = await prisma.precon.findUnique({
    where: { slug: base },
    select: { mtgjsonFileName: true },
  });
  if (!existing || existing.mtgjsonFileName === mtgjsonFileName) return base;
  const suffix = mtgjsonFileName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(-24);
  return `${base}-${suffix || "deck"}`;
}

async function upsertPrecon(
  prisma: PrismaClient,
  entry: DeckListEntry,
  deckRaw: MtgjsonDeckFile,
): Promise<{ ok: boolean; unresolved: number; cards: number }> {
  const deck = unwrapDeck(deckRaw);
  const type = (deck.type ?? entry.type ?? "").trim();
  if (!isMtgjsonConstructedDeckType(type)) {
    return { ok: false, unresolved: 0, cards: 0 };
  }

  const format = mapMtgjsonDeckToFormat({
    type,
    name: deck.name ?? entry.name,
    code: deck.code ?? entry.code,
  });
  if (!format) {
    return { ok: false, unresolved: 0, cards: 0 };
  }

  const name = (deck.name ?? entry.name).trim();
  const code = (deck.code ?? entry.code).trim().toLowerCase();
  const releaseRaw = deck.releaseDate ?? entry.releaseDate;
  const releaseDate =
    releaseRaw && !Number.isNaN(Date.parse(releaseRaw))
      ? new Date(releaseRaw)
      : null;

  const baseSlug = toPreconSlug(name, code);
  const slug = await ensureUniqueSlug(prisma, baseSlug, entry.fileName);

  const lines: Array<{
    card: MtgjsonCardDeckLike;
    board: "main" | "side" | "commander" | "companion" | "token";
  }> = [];
  for (const card of deck.commander ?? []) {
    lines.push({ card, board: "commander" });
  }
  for (const card of deck.mainBoard ?? []) {
    lines.push({ card, board: "main" });
  }
  for (const card of deck.sideBoard ?? []) {
    lines.push({ card, board: "side" });
  }
  for (const card of deck.tokens ?? []) {
    lines.push({ card, board: "token" });
  }

  type ResolvedLine = {
    oracleId: string;
    quantity: number;
    board: "main" | "side" | "commander" | "companion" | "token";
    preferredPrintingId: string | null;
  };
  let unresolved = 0;

  // Merge duplicate oracle+board by summing qty (keep first preferred printing).
  const merged = new Map<string, ResolvedLine>();

  for (const line of lines) {
    const row = await resolveMtgjsonCardDeck(prisma, line.card, line.board);
    if (!row) {
      unresolved += 1;
      continue;
    }
    const key = `${row.oracleId}|${row.board}`;
    const prev = merged.get(key);
    if (prev) {
      prev.quantity += row.quantity;
      if (!prev.preferredPrintingId && row.preferredPrintingId) {
        prev.preferredPrintingId = row.preferredPrintingId;
      }
    } else {
      merged.set(key, { ...row });
    }
  }

  const cards = [...merged.values()];
  if (cards.length === 0) {
    return { ok: false, unresolved, cards: 0 };
  }

  const colorIdentity = await computeColorIdentityForPreconCards(prisma, cards);

  await prisma.$transaction(async (tx) => {
    const precon = await tx.precon.upsert({
      where: { mtgjsonFileName: entry.fileName },
      create: {
        mtgjsonFileName: entry.fileName,
        code,
        name,
        slug,
        type: type.toLowerCase(),
        format,
        colorIdentity,
        releaseDate,
        syncedAt: new Date(),
      },
      update: {
        code,
        name,
        slug,
        type: type.toLowerCase(),
        format,
        colorIdentity,
        releaseDate,
        syncedAt: new Date(),
      },
      select: { id: true },
    });

    await tx.preconCard.deleteMany({ where: { preconId: precon.id } });
    await tx.preconCard.createMany({
      data: cards.map((c) => ({
        preconId: precon.id,
        oracleId: c.oracleId,
        quantity: c.quantity,
        board: c.board,
        preferredPrintingId: c.preferredPrintingId,
      })),
    });
  });

  return { ok: true, unresolved, cards: cards.length };
}

async function main() {
  const { ifChanged, limit } = parseArgs();
  const { createScriptPrismaClient } = await import("../../src/lib/db");
  const prisma = createScriptPrismaClient();

  const syncLog = await prisma.syncLog.create({
    data: {
      source: SyncSource.MTGJSON,
      jobType: JOB_TYPE,
      status: SyncStatus.RUNNING,
    },
  });

  const scratch = await mkdtemp(join(tmpdir(), "mtgjson-precons-"));

  try {
    console.log("Fetching MTGJSON DeckList.json.gz...");
    const listRaw = (await fetchJsonGz(DECK_LIST_URL)) as DeckListFile;
    const metaDate = listRaw.meta?.date ?? null;

    if (ifChanged && metaDate) {
      const last = await getLastMetaDate(prisma);
      if (last && last === metaDate) {
        console.log(`No change (meta.date=${metaDate}). Skipping deck fetch.`);
        const backfilled = await recomputeAllPreconColorIdentities(prisma);
        console.log(`Backfilled color identity on ${backfilled} precons.`);
        await prisma.syncLog.update({
          where: { id: syncLog.id },
          data: {
            status: SyncStatus.SUCCESS,
            completedAt: new Date(),
            recordsProcessed: backfilled,
            errors: { metaDate, skipped: true, colorIdentityBackfill: backfilled },
          },
        });
        return;
      }
    }

    const allEntries = listRaw.data ?? [];
    const entries = allEntries.filter((e) =>
      isMtgjsonConstructedDeckType(e.type),
    );
    const work = limit ? entries.slice(0, limit) : entries;
    console.log(
      `DeckList: ${allEntries.length} total → ${entries.length} constructed (processing ${work.length})...`,
    );
    if (entries.length === 0 && allEntries.length > 0) {
      const sampleTypes = [
        ...new Set(allEntries.map((e) => e.type).filter(Boolean)),
      ].slice(0, 12);
      console.warn(
        `Allowlist matched 0 types. Sample DeckList types: ${sampleTypes.join(", ")}`,
      );
    }

    let processed = 0;
    let upserted = 0;
    let skipped = 0;
    let unresolvedCards = 0;
    let fetchErrors = 0;

    await mapPool(work, FETCH_CONCURRENCY, async (entry) => {
      try {
        const deck = await fetchDeckFile(entry.fileName);
        // Optional cache for debugging
        await mkdir(scratch, { recursive: true });
        await writeFile(
          join(scratch, `${entry.fileName}.json`),
          JSON.stringify(deck),
        );

        const result = await upsertPrecon(prisma, entry, deck);
        processed += 1;
        if (result.ok) {
          upserted += 1;
          unresolvedCards += result.unresolved;
        } else {
          skipped += 1;
          unresolvedCards += result.unresolved;
        }
        process.stdout.write(
          `\rProcessed ${processed}/${work.length} (upserted ${upserted}, skipped ${skipped})...`,
        );
      } catch (err) {
        processed += 1;
        fetchErrors += 1;
        skipped += 1;
        console.error(
          `\nFailed ${entry.fileName}:`,
          err instanceof Error ? err.message : err,
        );
      }
    });

    console.log(
      `\nDone. upserted=${upserted} skipped=${skipped} unresolvedCards=${unresolvedCards} fetchErrors=${fetchErrors}`,
    );

    await prisma.syncLog.update({
      where: { id: syncLog.id },
      data: {
        status: SyncStatus.SUCCESS,
        completedAt: new Date(),
        recordsProcessed: upserted,
        errors: {
          metaDate,
          constructedListed: entries.length,
          processed: work.length,
          skipped,
          unresolvedCards,
          fetchErrors,
        },
      },
    });
  } catch (error) {
    await prisma.syncLog.update({
      where: { id: syncLog.id },
      data: {
        status: SyncStatus.FAILED,
        completedAt: new Date(),
        errors: {
          message: error instanceof Error ? error.message : String(error),
        },
      },
    });
    throw error;
  } finally {
    await rm(scratch, { recursive: true, force: true }).catch(() => undefined);
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
