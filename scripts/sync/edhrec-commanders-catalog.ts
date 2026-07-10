import { config } from "dotenv";

import { EdhrecSyncTier, SyncSource, SyncStatus } from "../../src/generated/prisma/client";
import type { PrismaClient } from "../../src/generated/prisma/client";
import { fetchCardPage, fetchCommanderPage, rateLimitPause } from "../../src/lib/edhrec/client";
import { mapCommanderProfile } from "../../src/lib/edhrec/parse";
import {
  playableCatalogCardWhere,
  resolvePlayableCardId,
} from "../../src/lib/scryfall/catalog-filters";

config({ path: ".env.local" });
config({ path: ".env" });

const DEFAULT_BATCH_SIZE = 150;
const DEFAULT_OFFSET = 0;
const DEFAULT_DELAY_MS = 1000;

type CatalogTarget = {
  slug: string;
  name: string;
};

type ResolvedCommanderPage =
  | {
      kind: "commander";
      page: NonNullable<Awaited<ReturnType<typeof fetchCommanderPage>>>;
    }
  | { kind: "card_only" }
  | { kind: "no_page" }
  | { kind: "blocked" };

type SyncStats = {
  synced: number;
  cardOnly: number;
  noPage: number;
  blocked: number;
  failures: { slug: string; message: string }[];
};

type CatalogSyncOptions = {
  batchSize: number;
  offset: number;
  delayMs: number;
  missingOnly: boolean;
};

function parseFlag(name: string): boolean {
  return process.argv.includes(name);
}

function parseNumericArg(prefix: string, fallback: number): number {
  const arg = process.argv.find((value) => value.startsWith(`${prefix}=`));
  if (!arg) {
    return fallback;
  }

  const parsed = Number(arg.split("=")[1]);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : fallback;
}

function parseOptions(): CatalogSyncOptions {
  return {
    batchSize: parseNumericArg("--batch-size", DEFAULT_BATCH_SIZE),
    offset: parseNumericArg("--offset", DEFAULT_OFFSET),
    delayMs: parseNumericArg("--delay-ms", DEFAULT_DELAY_MS),
    missingOnly: !parseFlag("--all"),
  };
}

async function discoverCatalogTargets(
  prisma: PrismaClient,
  missingOnly: boolean,
): Promise<CatalogTarget[]> {
  const commanders = await prisma.card.findMany({
    where: {
      isCommander: true,
      edhrecSlug: { not: null },
      ...playableCatalogCardWhere,
    },
    select: { edhrecSlug: true, name: true },
    orderBy: [{ edhrecSlug: "asc" }, { name: "asc" }],
  });

  const bySlug = new Map<string, string>();
  for (const commander of commanders) {
    if (!commander.edhrecSlug || bySlug.has(commander.edhrecSlug)) {
      continue;
    }

    bySlug.set(commander.edhrecSlug, commander.name);
  }

  let targets = [...bySlug.entries()].map(([slug, name]) => ({ slug, name }));

  if (missingOnly) {
    const existing = await prisma.edhrecCommanderProfile.findMany({
      select: { slug: true },
    });
    const existingSlugs = new Set(existing.map((profile) => profile.slug));
    targets = targets.filter((target) => !existingSlugs.has(target.slug));
  }

  return targets;
}

function hasCommanderPayload(
  page: Awaited<ReturnType<typeof fetchCommanderPage>>,
): page is NonNullable<Awaited<ReturnType<typeof fetchCommanderPage>>> {
  return Boolean(page?.container?.json_dict?.card?.sanitized);
}

function hasCardPayload(page: Awaited<ReturnType<typeof fetchCardPage>>): boolean {
  return Boolean(page?.container?.json_dict?.card?.sanitized);
}

async function resolveCommanderPage(slug: string): Promise<ResolvedCommanderPage> {
  const commanderPage = await fetchCommanderPage(slug);
  if (hasCommanderPayload(commanderPage)) {
    return { kind: "commander", page: commanderPage };
  }

  const cardPage = await fetchCardPage(slug);
  if (hasCardPayload(cardPage)) {
    return { kind: "card_only" };
  }

  if (commanderPage === null && cardPage === null) {
    return { kind: "blocked" };
  }

  return { kind: "no_page" };
}

async function syncCatalogTarget(
  prisma: PrismaClient,
  target: CatalogTarget,
  stats: SyncStats,
): Promise<void> {
  const result = await resolveCommanderPage(target.slug);

  if (result.kind === "card_only") {
    stats.cardOnly += 1;
    return;
  }

  if (result.kind === "no_page") {
    stats.noPage += 1;
    stats.failures.push({ slug: target.slug, message: "No EDHREC commander or card page" });
    return;
  }

  if (result.kind === "blocked") {
    stats.blocked += 1;
    stats.failures.push({ slug: target.slug, message: "EDHREC request blocked (403)" });
    return;
  }

  const existing = await prisma.edhrecCommanderProfile.findUnique({
    where: { slug: target.slug },
    select: { syncTier: true },
  });
  const tier =
    existing?.syncTier === EdhrecSyncTier.HOT ? EdhrecSyncTier.HOT : EdhrecSyncTier.COLD;

  const profile = mapCommanderProfile(result.page, tier);
  const cardId = await resolvePlayableCardId(prisma, profile.slug);

  await prisma.edhrecCommanderProfile.upsert({
    where: { slug: profile.slug },
    create: { ...profile, cardId },
    update: { ...profile, cardId },
  });

  stats.synced += 1;
}

async function main() {
  const options = parseOptions();
  const { createScriptPrismaClient } = await import("../../src/lib/db");
  const prisma = createScriptPrismaClient();

  const allTargets = await discoverCatalogTargets(prisma, options.missingOnly);
  const batch = allTargets.slice(options.offset, options.offset + options.batchSize);

  console.log(
    `Catalog sync: ${batch.length} targets in this batch (${allTargets.length} total ${options.missingOnly ? "missing" : "catalog"} slugs, offset ${options.offset}).`,
  );

  if (batch.length === 0) {
    console.log("Nothing to sync in this batch.");
    await prisma.$disconnect();
    return;
  }

  const syncLog = await prisma.syncLog.create({
    data: {
      source: SyncSource.EDHREC,
      jobType: "commanders_catalog",
      status: SyncStatus.RUNNING,
    },
  });

  const stats: SyncStats = {
    synced: 0,
    cardOnly: 0,
    noPage: 0,
    blocked: 0,
    failures: [],
  };

  try {
    for (const [index, target] of batch.entries()) {
      await syncCatalogTarget(prisma, target, stats);
      process.stdout.write(
        `\rSynced ${stats.synced}/${batch.length} · card-only ${stats.cardOnly} · no-page ${stats.noPage} · blocked ${stats.blocked}`,
      );

      if (index < batch.length - 1) {
        await rateLimitPause(options.delayMs);
      }
    }

    const remainingAfterBatch = Math.max(
      0,
      allTargets.length - (options.offset + batch.length),
    );

    console.log(
      `\nDone. ${stats.synced} profiles upserted (COLD tier). card-only ${stats.cardOnly}, no-page ${stats.noPage}, blocked ${stats.blocked}.`,
    );

    if (remainingAfterBatch > 0) {
      const nextOffset = options.offset + batch.length;
      console.log(
        `Remaining in this run list: ${remainingAfterBatch}. Continue with:\n  npm run sync:edhrec-commanders-catalog -- --offset=${nextOffset} --batch-size=${options.batchSize}${options.missingOnly ? "" : " --all"}`,
      );
    } else if (options.missingOnly) {
      const stillMissing = (await discoverCatalogTargets(prisma, true)).length;
      if (stillMissing > 0) {
        console.log(
          `${stillMissing} commander slugs still missing profiles. Re-run:\n  npm run sync:edhrec-commanders-catalog`,
        );
      } else {
        console.log("All catalog commander slugs with EDHREC pages are cached.");
      }
    }

    await prisma.syncLog.update({
      where: { id: syncLog.id },
      data: {
        status: SyncStatus.SUCCESS,
        completedAt: new Date(),
        recordsProcessed: stats.synced,
        errors: {
          cardOnly: stats.cardOnly,
          noPage: stats.noPage,
          blocked: stats.blocked,
          offset: options.offset,
          batchSize: options.batchSize,
          missingOnly: options.missingOnly,
          failures: stats.failures.slice(0, 25),
        },
      },
    });
  } catch (error) {
    await prisma.syncLog.update({
      where: { id: syncLog.id },
      data: {
        status: SyncStatus.FAILED,
        completedAt: new Date(),
        recordsProcessed: stats.synced,
        errors: {
          message: error instanceof Error ? error.message : String(error),
          cardOnly: stats.cardOnly,
          noPage: stats.noPage,
          blocked: stats.blocked,
          failures: stats.failures.slice(0, 25),
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
