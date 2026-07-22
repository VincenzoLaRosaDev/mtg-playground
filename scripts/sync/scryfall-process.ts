import { createGunzip } from "node:zlib";
import { createInterface } from "node:readline";
import { Readable } from "node:stream";
import { config } from "dotenv";

import {
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
import { computeFrictionScore } from "../../src/lib/classification/friction";
import { computeColorSortKey } from "../../src/lib/browse/color-sort";
import { buildCardSearchDocumentFromScryfall } from "../../src/lib/search/card-text-search";
import { parseCatalogListPrice } from "../../src/lib/scryfall/card-prices";

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
    // Tag-based +1 applied later by classifications job; GC contributes here.
    frictionScore: computeFrictionScore({ isGameChanger, tagSlugs: [] }),
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
      friction_score,
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
          ${card.frictionScore},
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
      friction_score = EXCLUDED.friction_score,
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

  return { processed, skipped, excluded };
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

    const { processed, skipped, excluded } = await processBulkStream(
      prisma,
      response.body,
    );
    const purged = await prisma.card.deleteMany({
      where: { layout: "art_series" },
    });
    console.log(
      `\nDone. ${processed} cards upserted, ${skipped} lines skipped, ${excluded} excluded layouts, ${purged.count} art_series purged.`,
    );

    await prisma.syncLog.update({
      where: { id: syncLog.id },
      data: {
        status: SyncStatus.SUCCESS,
        completedAt: new Date(),
        recordsProcessed: processed,
        errors: {
          bulkUpdatedAt: bulk.updated_at,
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
