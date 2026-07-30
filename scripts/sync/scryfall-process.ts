import { randomUUID } from "node:crypto";
import { createGunzip } from "node:zlib";
import { createInterface } from "node:readline";
import { Readable } from "node:stream";
import { config } from "dotenv";

import {
  CardRelationComponent,
  Prisma,
  SyncSource,
  SyncStatus,
} from "../../src/generated/prisma/client";
import type { PrismaClient } from "../../src/generated/prisma/client";
import {
  fetchBulkMetadata,
  getBulkDownloadUrl,
  ORACLE_CARDS_BULK_TYPE,
  SCRYFALL_USER_AGENT,
} from "../../src/lib/scryfall/bulk-client";
import type { ScryfallCard } from "../../src/lib/scryfall/types";
import {
  getCmc,
  getImageUri,
  isCommanderLegal,
  normalizeSearchName,
  toCardSlug,
} from "../../src/lib/scryfall/card-utils";
import { mapScryfallFaces } from "../../src/lib/scryfall/faces";
import { shouldIndexScryfallCard } from "../../src/lib/scryfall/catalog-filters";
import { classifyTokenOrExtra } from "../../src/lib/decks/relation-classify";
import { computeColorSortKey } from "../../src/lib/browse/color-sort";
import { buildCardSearchDocumentFromScryfall } from "../../src/lib/search/card-text-search";
import { parseCatalogListPrice } from "../../src/lib/scryfall/card-prices";

type PendingRelation = {
  oracleId: string;
  relatedScryfallId: string;
  name: string;
  typeLine: string;
};

function isAllPartsRelationComponent(component: string): boolean {
  return (
    component === "token" ||
    component === "combo_piece" ||
    component === "meld_part" ||
    component === "meld_result"
  );
}

function collectPendingRelations(
  card: ScryfallCard,
  out: PendingRelation[],
): void {
  const parts = card.all_parts;
  if (!parts?.length) return;
  for (const part of parts) {
    if (!part.id || part.id === card.id) continue;
    if (!isAllPartsRelationComponent(part.component)) continue;
    out.push({
      oracleId: card.oracle_id,
      relatedScryfallId: part.id,
      name: part.name,
      typeLine: part.type_line ?? "",
    });
  }
}

async function replaceCardRelations(
  prisma: PrismaClient,
  pending: PendingRelation[],
): Promise<number> {
  if (pending.length === 0) {
    await prisma.cardRelation.deleteMany({});
    return 0;
  }

  const relatedIds = [...new Set(pending.map((p) => p.relatedScryfallId))];
  const oracleByScryfallId = new Map<string, string>();

  // 1) oracle_cards representative id
  for (let i = 0; i < relatedIds.length; i += BATCH_SIZE) {
    const chunk = relatedIds.slice(i, i + BATCH_SIZE);
    const relatedCards = await prisma.card.findMany({
      where: { id: { in: chunk } },
      select: { id: true, oracleId: true },
    });
    for (const c of relatedCards) {
      oracleByScryfallId.set(c.id, c.oracleId);
    }
  }

  // 2) all_parts often points at a printing id, not the oracle representative
  const missingAfterCards = relatedIds.filter((id) => !oracleByScryfallId.has(id));
  for (let i = 0; i < missingAfterCards.length; i += BATCH_SIZE) {
    const chunk = missingAfterCards.slice(i, i + BATCH_SIZE);
    const printings = await prisma.printing.findMany({
      where: { id: { in: chunk } },
      select: { id: true, oracleId: true },
    });
    for (const p of printings) {
      oracleByScryfallId.set(p.id, p.oracleId);
    }
  }

  // 3) fallback: exact name (classify/denylist runs after resolve)
  const namesNeedingFallback = [
    ...new Set(
      pending
        .filter((p) => !oracleByScryfallId.has(p.relatedScryfallId))
        .map((p) => p.name)
        .filter(Boolean),
    ),
  ];
  const oracleByRelatedName = new Map<string, string>();
  for (let i = 0; i < namesNeedingFallback.length; i += BATCH_SIZE) {
    const chunk = namesNeedingFallback.slice(i, i + BATCH_SIZE);
    const named = await prisma.card.findMany({
      where: { name: { in: chunk } },
      select: { name: true, oracleId: true, layout: true },
      orderBy: { name: "asc" },
    });
    // Prefer token/emblem layouts when names collide with playable cards.
    for (const c of named) {
      const existing = oracleByRelatedName.get(c.name);
      if (!existing) {
        oracleByRelatedName.set(c.name, c.oracleId);
        continue;
      }
      if (
        c.layout === "token" ||
        c.layout === "double_faced_token" ||
        c.layout === "emblem"
      ) {
        oracleByRelatedName.set(c.name, c.oracleId);
      }
    }
  }

  const resolvedOracleIds = [
    ...new Set(
      pending
        .map(
          (p) =>
            oracleByScryfallId.get(p.relatedScryfallId) ??
            oracleByRelatedName.get(p.name),
        )
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  const metaByOracle = new Map<
    string,
    { layout: string; typeLine: string; name: string }
  >();
  for (let i = 0; i < resolvedOracleIds.length; i += BATCH_SIZE) {
    const chunk = resolvedOracleIds.slice(i, i + BATCH_SIZE);
    const cards = await prisma.card.findMany({
      where: { oracleId: { in: chunk } },
      select: { oracleId: true, layout: true, typeLine: true, name: true },
    });
    for (const c of cards) {
      metaByOracle.set(c.oracleId, {
        layout: c.layout,
        typeLine: c.typeLine,
        name: c.name,
      });
    }
  }

  const rows: {
    id: string;
    oracleId: string;
    relatedOracleId: string;
    component: CardRelationComponent;
    name: string;
    typeLine: string;
  }[] = [];
  const seen = new Set<string>();

  for (const edge of pending) {
    const relatedOracleId =
      oracleByScryfallId.get(edge.relatedScryfallId) ??
      oracleByRelatedName.get(edge.name);
    if (!relatedOracleId || relatedOracleId === edge.oracleId) continue;
    const meta = metaByOracle.get(relatedOracleId);
    const layout = meta?.layout ?? "";
    const typeLine = meta?.typeLine || edge.typeLine;
    const kind = classifyTokenOrExtra(layout, typeLine);
    if (!kind) continue;
    const component =
      kind === "token"
        ? CardRelationComponent.token
        : CardRelationComponent.extra;
    const key = `${edge.oracleId}|${relatedOracleId}|${component}`;
    if (seen.has(key)) continue;
    seen.add(key);
    rows.push({
      id: randomUUID(),
      oracleId: edge.oracleId,
      relatedOracleId,
      component,
      name: meta?.name ?? edge.name,
      typeLine,
    });
  }

  await prisma.cardRelation.deleteMany({});
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    await prisma.cardRelation.createMany({
      data: rows.slice(i, i + BATCH_SIZE),
    });
  }

  return rows.length;
}

// Must run before importing db.ts (that module reads DATABASE_URL at load time)
config({ path: ".env.local" });
config({ path: ".env" });

const BATCH_SIZE = 200;
const JOB_TYPE = "oracle_cards_full";

function parseArgs() {
  return {
    ifChanged: process.argv.includes("--if-changed"),
  };
}

async function getLastSuccessfulBulkUpdatedAt(
  prisma: PrismaClient,
): Promise<string | null> {
  const last = await prisma.syncLog.findFirst({
    where: {
      source: SyncSource.SCRYFALL,
      jobType: JOB_TYPE,
      status: SyncStatus.SUCCESS,
    },
    orderBy: { completedAt: "desc" },
    select: { errors: true },
  });

  if (!last?.errors || typeof last.errors !== "object" || Array.isArray(last.errors)) {
    return null;
  }

  const bulkUpdatedAt = (last.errors as Record<string, unknown>).bulkUpdatedAt;
  return typeof bulkUpdatedAt === "string" ? bulkUpdatedAt : null;
}

function faceStat(
  card: ScryfallCard,
  key: "power" | "toughness" | "loyalty" | "mana_cost",
): string | null {
  const top = card[key];
  if (typeof top === "string" && top.length > 0) {
    return top;
  }
  const face = card.card_faces?.[0];
  const faceValue = face?.[key];
  return typeof faceValue === "string" && faceValue.length > 0 ? faceValue : null;
}

function mapCard(card: ScryfallCard) {
  const isGameChanger = Boolean(card.game_changer);
  return {
    id: card.id,
    oracleId: card.oracle_id,
    name: card.name,
    searchName: normalizeSearchName(card.name),
    slug: toCardSlug(card.name),
    typeLine: card.type_line,
    cmc: getCmc(card),
    manaCost: faceStat(card, "mana_cost"),
    colors: card.colors ?? [],
    colorIdentity: card.color_identity ?? [],
    oracleText: card.oracle_text ?? null,
    keywords: card.keywords ?? [],
    producedMana: card.produced_mana ?? [],
    layout: card.layout,
    imageUri: getImageUri(card),
    faces: mapScryfallFaces(card) ?? Prisma.JsonNull,
    legalities: card.legalities,
    prices: card.prices ?? undefined,
    power: faceStat(card, "power"),
    toughness: faceStat(card, "toughness"),
    loyalty: faceStat(card, "loyalty"),
    popularityRank: card.edhrec_rank ?? null,
    isGameChanger,
    isReserved: Boolean(card.reserved),
    isCommander: isCommanderLegal(card),
    colorSort: computeColorSortKey(card.colors ?? []),
    listPriceEur: parseCatalogListPrice(card.prices),
    searchDocument: buildCardSearchDocumentFromScryfall(card),
    syncedAt: new Date(),
  };
}

/** SQL NULL for missing JSON; otherwise parameterized jsonb. */
function jsonbSql(
  value: Prisma.InputJsonValue | typeof Prisma.JsonNull | undefined | null,
): Prisma.Sql {
  if (value === undefined || value === null || value === Prisma.JsonNull) {
    return Prisma.sql`NULL`;
  }
  return Prisma.sql`${JSON.stringify(value)}::jsonb`;
}

async function upsertBatch(
  prisma: PrismaClient,
  cards: ReturnType<typeof mapCard>[],
) {
  // Dedupe by oracleId within the batch (last wins) — oracle_cards is 1:1 but
  // Scryfall may rotate the representative scryfall id for an oracle.
  const byOracle = new Map(cards.map((card) => [card.oracleId, card]));
  const uniqueCards = [...byOracle.values()];
  if (uniqueCards.length === 0) return;

  // Bulk INSERT … ON CONFLICT (oracle_id): keep existing PK (`id`), update the rest.
  await prisma.$executeRaw`
    INSERT INTO cards (
      id,
      oracle_id,
      name,
      search_name,
      slug,
      type_line,
      cmc,
      mana_cost,
      colors,
      color_identity,
      oracle_text,
      keywords,
      produced_mana,
      layout,
      image_uri,
      faces,
      legalities,
      prices,
      power,
      toughness,
      loyalty,
      popularity_rank,
      is_game_changer,
      is_reserved,
      is_commander,
      color_sort,
      list_price_eur,
      search_document,
      synced_at
    ) VALUES ${Prisma.join(
      uniqueCards.map(
        (card) => Prisma.sql`(
          ${card.id},
          ${card.oracleId},
          ${card.name},
          ${card.searchName},
          ${card.slug},
          ${card.typeLine},
          ${card.cmc},
          ${card.manaCost},
          ${card.colors}::text[],
          ${card.colorIdentity}::text[],
          ${card.oracleText},
          ${card.keywords}::text[],
          ${card.producedMana}::text[],
          ${card.layout},
          ${card.imageUri},
          ${jsonbSql(card.faces)},
          ${jsonbSql(card.legalities)},
          ${jsonbSql(card.prices)},
          ${card.power},
          ${card.toughness},
          ${card.loyalty},
          ${card.popularityRank},
          ${card.isGameChanger},
          ${card.isReserved},
          ${card.isCommander},
          ${card.colorSort},
          ${card.listPriceEur},
          ${card.searchDocument},
          ${card.syncedAt}
        )`,
      ),
    )}
    ON CONFLICT (oracle_id) DO UPDATE SET
      name = EXCLUDED.name,
      search_name = EXCLUDED.search_name,
      slug = EXCLUDED.slug,
      type_line = EXCLUDED.type_line,
      cmc = EXCLUDED.cmc,
      mana_cost = EXCLUDED.mana_cost,
      colors = EXCLUDED.colors,
      color_identity = EXCLUDED.color_identity,
      oracle_text = EXCLUDED.oracle_text,
      keywords = EXCLUDED.keywords,
      produced_mana = EXCLUDED.produced_mana,
      layout = EXCLUDED.layout,
      image_uri = EXCLUDED.image_uri,
      faces = EXCLUDED.faces,
      legalities = EXCLUDED.legalities,
      prices = EXCLUDED.prices,
      power = EXCLUDED.power,
      toughness = EXCLUDED.toughness,
      loyalty = EXCLUDED.loyalty,
      popularity_rank = EXCLUDED.popularity_rank,
      is_game_changer = EXCLUDED.is_game_changer,
      is_reserved = EXCLUDED.is_reserved,
      is_commander = EXCLUDED.is_commander,
      color_sort = EXCLUDED.color_sort,
      list_price_eur = EXCLUDED.list_price_eur,
      search_document = EXCLUDED.search_document,
      synced_at = EXCLUDED.synced_at
  `;
}

async function processBulkStream(
  prisma: PrismaClient,
  body: ReadableStream<Uint8Array>,
) {
  const nodeStream = Readable.fromWeb(body as Parameters<typeof Readable.fromWeb>[0]);
  const gunzip = createGunzip();
  const lines = createInterface({ input: nodeStream.pipe(gunzip), crlfDelay: Infinity });

  let batch: ReturnType<typeof mapCard>[] = [];
  const pendingRelations: PendingRelation[] = [];
  let processed = 0;
  let skipped = 0;
  let excluded = 0;

  for await (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    let card: ScryfallCard;
    try {
      card = JSON.parse(trimmed) as ScryfallCard;
    } catch {
      skipped += 1;
      continue;
    }

    if (!card.id || !card.oracle_id || !card.name) {
      skipped += 1;
      continue;
    }

    if (!shouldIndexScryfallCard(card)) {
      excluded += 1;
      continue;
    }

    collectPendingRelations(card, pendingRelations);
    batch.push(mapCard(card));

    if (batch.length >= BATCH_SIZE) {
      await upsertBatch(prisma, batch);
      processed += batch.length;
      process.stdout.write(`\rProcessed ${processed} cards...`);
      batch = [];
    }
  }

  if (batch.length > 0) {
    await upsertBatch(prisma, batch);
    processed += batch.length;
  }

  const relations = await replaceCardRelations(prisma, pendingRelations);
  return { processed, skipped, excluded, relations };
}

async function main() {
  const { ifChanged } = parseArgs();
  const { createScriptPrismaClient } = await import("../../src/lib/db");
  const prisma = createScriptPrismaClient();

  console.log("Fetching Scryfall bulk metadata...");
  const bulk = await fetchBulkMetadata(ORACLE_CARDS_BULK_TYPE);

  if (ifChanged) {
    const lastBulkUpdatedAt = await getLastSuccessfulBulkUpdatedAt(prisma);
    if (lastBulkUpdatedAt && lastBulkUpdatedAt === bulk.updated_at) {
      console.log(
        `Bulk unchanged (${bulk.updated_at}). Skipping download (--if-changed).`,
      );
      await prisma.syncLog.create({
        data: {
          source: SyncSource.SCRYFALL,
          jobType: JOB_TYPE,
          status: SyncStatus.SUCCESS,
          completedAt: new Date(),
          recordsProcessed: 0,
          errors: {
            skipped: true,
            reason: "bulk_unchanged",
            bulkUpdatedAt: bulk.updated_at,
          },
        },
      });
      await prisma.$disconnect();
      return;
    }
  }

  const syncLog = await prisma.syncLog.create({
    data: {
      source: SyncSource.SCRYFALL,
      jobType: JOB_TYPE,
      status: SyncStatus.RUNNING,
    },
  });

  try {
    const downloadUrl = getBulkDownloadUrl(bulk);
    console.log(`Downloading ${ORACLE_CARDS_BULK_TYPE} (updated ${bulk.updated_at})...`);

    const response = await fetch(downloadUrl, {
      headers: { "User-Agent": SCRYFALL_USER_AGENT },
    });

    if (!response.ok || !response.body) {
      throw new Error(`Download failed: ${response.status}`);
    }

    const { processed, skipped, excluded, relations } = await processBulkStream(
      prisma,
      response.body,
    );
    const purged = await prisma.card.deleteMany({
      where: { layout: "art_series" },
    });
    console.log(
      `\nDone. ${processed} cards upserted, ${skipped} lines skipped, ${excluded} excluded layouts, ${relations} token/extra relations, ${purged.count} art_series purged.`,
    );

    await prisma.syncLog.update({
      where: { id: syncLog.id },
      data: {
        status: SyncStatus.SUCCESS,
        completedAt: new Date(),
        recordsProcessed: processed,
        errors: {
          bulkUpdatedAt: bulk.updated_at,
          relations,
          ...(skipped > 0 || excluded > 0 || purged.count > 0
            ? { skipped, excluded, purged: purged.count }
            : {}),
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
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
