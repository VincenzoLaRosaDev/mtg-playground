import { config } from "dotenv";

import { SyncSource, SyncStatus } from "../../src/generated/prisma/client";
import type { PrismaClient } from "../../src/generated/prisma/client";
import { getImageUri } from "../../src/lib/scryfall/card-utils";
import type { ScryfallSearchCard, ScryfallSearchResult } from "../../src/lib/scryfall/types";

config({ path: ".env.local" });
config({ path: ".env" });

const USER_AGENT = "EDHForge/1.0";
const REQUEST_DELAY_MS = 100;
const BATCH_SIZE = 100;

function parseCodes(): string[] | null {
  const codesArg = process.argv.find((arg) => arg.startsWith("--codes="));
  if (!codesArg) {
    return null;
  }

  return codesArg
    .split("=")[1]
    ?.split(",")
    .map((code) => code.trim().toLowerCase())
    .filter(Boolean) ?? null;
}

function parseLimit(): number | null {
  const limitArg = process.argv.find((arg) => arg.startsWith("--limit="));
  if (!limitArg) {
    return null;
  }

  const value = Number(limitArg.split("=")[1]);
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : null;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function mapSetCard(setCode: string, card: ScryfallSearchCard) {
  return {
    setCode,
    oracleId: card.oracle_id,
    name: card.name,
    collectorNumber: card.collector_number,
    rarity: card.rarity,
    imageUri: getImageUri(card),
  };
}

async function fetchSetCards(setCode: string): Promise<ReturnType<typeof mapSetCard>[]> {
  const cards: ReturnType<typeof mapSetCard>[] = [];
  const seen = new Set<string>();
  let nextUrl: string | null =
    `https://api.scryfall.com/cards/search?${new URLSearchParams({
      q: `e:${setCode}`,
      unique: "cards",
      order: "set",
    }).toString()}`;

  while (nextUrl) {
    const response = await fetch(nextUrl, {
      headers: { Accept: "application/json", "User-Agent": USER_AGENT },
    });

    if (response.status === 404) {
      return cards;
    }

    if (!response.ok) {
      throw new Error(`Scryfall search failed for ${setCode}: ${response.status}`);
    }

    const page = (await response.json()) as ScryfallSearchResult;

    for (const card of page.data) {
      if (!card.oracle_id || seen.has(card.oracle_id)) {
        continue;
      }

      seen.add(card.oracle_id);
      cards.push(mapSetCard(setCode, card));
    }

    nextUrl = page.has_more ? (page.next_page ?? null) : null;

    if (nextUrl) {
      await sleep(REQUEST_DELAY_MS);
    }
  }

  return cards;
}

async function upsertSetCards(
  prisma: PrismaClient,
  setCode: string,
  cards: ReturnType<typeof mapSetCard>[],
) {
  for (let index = 0; index < cards.length; index += BATCH_SIZE) {
    const batch = cards.slice(index, index + BATCH_SIZE);

    await prisma.$transaction(
      batch.map((card) =>
        prisma.setCard.upsert({
          where: {
            setCode_oracleId: {
              setCode: card.setCode,
              oracleId: card.oracleId,
            },
          },
          create: card,
          update: card,
        }),
      ),
    );
  }

  await prisma.mtgSet.update({
    where: { code: setCode },
    data: { syncedAt: new Date() },
  });
}

async function main() {
  const codesFilter = parseCodes();
  const limit = parseLimit();
  const { createScriptPrismaClient } = await import("../../src/lib/db");
  const prisma = createScriptPrismaClient();

  const syncLog = await prisma.syncLog.create({
    data: {
      source: SyncSource.SCRYFALL,
      jobType: "set_cards",
      status: SyncStatus.RUNNING,
    },
  });

  let processed = 0;
  let cardRows = 0;
  const failures: { code: string; message: string }[] = [];

  try {
    const sets = await prisma.mtgSet.findMany({
      where: codesFilter ? { code: { in: codesFilter } } : undefined,
      orderBy: [{ releasedAt: "desc" }, { name: "asc" }],
      ...(limit ? { take: limit } : {}),
      select: { code: true, name: true, cardCount: true },
    });

    if (sets.length === 0) {
      throw new Error("No sets found. Run npm run sync:scryfall-sets first.");
    }

    console.log(`Syncing cards for ${sets.length} sets...`);

    for (const set of sets) {
      try {
        const cards = await fetchSetCards(set.code);

        if (cards.length > 0) {
          await upsertSetCards(prisma, set.code, cards);
        }

        processed += 1;
        cardRows += cards.length;
        process.stdout.write(
          `\rSets ${processed}/${sets.length} · ${cardRows} cards (${set.code})...`,
        );
      } catch (error) {
        failures.push({
          code: set.code,
          message: error instanceof Error ? error.message : String(error),
        });
      }

      await sleep(REQUEST_DELAY_MS);
    }

    console.log(`\nDone. ${processed} sets processed, ${cardRows} set-card rows upserted.`);

    await prisma.syncLog.update({
      where: { id: syncLog.id },
      data: {
        status: SyncStatus.SUCCESS,
        completedAt: new Date(),
        recordsProcessed: cardRows,
        errors:
          failures.length > 0
            ? { failedSets: failures.length, failures: failures.slice(0, 25) }
            : undefined,
      },
    });
  } catch (error) {
    await prisma.syncLog.update({
      where: { id: syncLog.id },
      data: {
        status: SyncStatus.FAILED,
        completedAt: new Date(),
        recordsProcessed: cardRows,
        errors: {
          message: error instanceof Error ? error.message : String(error),
          failures: failures.slice(0, 25),
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
