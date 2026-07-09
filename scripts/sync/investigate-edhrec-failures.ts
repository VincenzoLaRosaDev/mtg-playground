import { config } from "dotenv";

config({ path: ".env.local" });
config({ path: ".env" });

const USER_AGENT = "EDHForge/1.0";

async function fetchCommanderPage(slug: string) {
  const url = `https://json.edhrec.com/pages/commanders/${encodeURIComponent(slug)}.json`;
  const response = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": USER_AGENT },
  });
  return { status: response.status, ok: response.ok, url };
}

async function main() {
  const { createScriptPrismaClient } = await import("../../src/lib/db");
  const prisma = createScriptPrismaClient();

  const latestLog = await prisma.syncLog.findFirst({
    where: { source: "EDHREC", jobType: "commanders_hot" },
    orderBy: { startedAt: "desc" },
  });

  const failures =
    (latestLog?.errors as { failures?: { slug: string; message: string }[] } | null)
      ?.failures ?? [];

  console.log("Latest sync:", {
    id: latestLog?.id,
    status: latestLog?.status,
    recordsProcessed: latestLog?.recordsProcessed,
    failureCount: failures.length,
  });

  const profileCount = await prisma.edhrecCommanderProfile.count();
  console.log("Profiles in DB:", profileCount);

  const localCommanders = await prisma.card.findMany({
    where: { isCommander: true, edhrecSlug: { not: null } },
    select: { edhrecSlug: true, name: true },
    orderBy: { name: "asc" },
    take: 600,
  });

  const profileSlugs = new Set(
    (
      await prisma.edhrecCommanderProfile.findMany({
        select: { slug: true },
      })
    ).map((p) => p.slug),
  );

  const missingFromDb = localCommanders
    .filter((c) => c.edhrecSlug && !profileSlugs.has(c.edhrecSlug))
    .slice(0, 60);

  console.log(`\nLocal commander cards without profile (sample ${missingFromDb.length}):`);

  for (const card of missingFromDb.slice(0, 15)) {
    const slug = card.edhrecSlug!;
    const result = await fetchCommanderPage(slug);
    let detail = `HTTP ${result.status}`;

    if (result.ok) {
      const response = await fetch(result.url, {
        headers: { Accept: "application/json", "User-Agent": USER_AGENT },
      });
      const body = (await response.json()) as {
        container?: { json_dict?: { card?: { sanitized?: string; name?: string } } };
      };
      const edhrecCard = body.container?.json_dict?.card;
      if (edhrecCard?.sanitized) {
        detail = `OK as "${edhrecCard.name}" (sanitized: ${edhrecCard.sanitized})`;
      } else {
        detail = "HTTP 200 but missing commander card payload";
      }
    }

    console.log(`- ${card.name}`);
    console.log(`  our slug: ${slug}`);
    console.log(`  result:   ${detail}`);
  }

  if (failures.length > 0) {
    console.log(`\nLogged failures from sync (${failures.length}, showing all):`);
    for (const f of failures) {
      console.log(`- ${f.slug}: ${f.message}`);
    }
  }

  // Recompute full missing set (sync log only stores first 25 failures)
  const { fetchTopCommandersFromSite } = await import("../../src/lib/edhrec/client");

  const fromSite = await fetchTopCommandersFromSite(100);
  const allLocalCommanders = await prisma.card.findMany({
    where: { isCommander: true, edhrecSlug: { not: null } },
    select: { edhrecSlug: true, name: true },
    orderBy: { name: "asc" },
    take: 1000,
  });

  const seen = new Set<string>();
  const targets: { slug: string; name: string; source: string }[] = [];
  for (const entry of fromSite) {
    if (!seen.has(entry.slug)) {
      seen.add(entry.slug);
      targets.push({ slug: entry.slug, name: entry.name, source: "edhrec-top" });
    }
  }
  for (const card of allLocalCommanders) {
    if (!card.edhrecSlug || seen.has(card.edhrecSlug)) continue;
    seen.add(card.edhrecSlug);
    targets.push({ slug: card.edhrecSlug, name: card.name, source: "local-catalog" });
    if (targets.length >= 500) break;
  }

  const missing = targets.filter((t) => !profileSlugs.has(t.slug));
  console.log(`\nFull missing set: ${missing.length} / ${targets.length} targets`);

  const categories = {
    slugMismatch: [] as string[],
    noCommanderPage: [] as string[],
    rateLimited: [] as string[],
    other: [] as string[],
  };

  for (const item of missing) {
    const ourResult = await fetchCommanderPage(item.slug);
    if (ourResult.ok) {
      categories.other.push(`${item.slug} (unexpected OK now)`);
      continue;
    }

    // Try apostrophe fix: gorion-s-ward -> gorions-ward
    const apostropheFix = item.slug.replace(/-s-/g, "s-").replace(/-s$/g, "s");
    if (apostropheFix !== item.slug) {
      const fixed = await fetchCommanderPage(apostropheFix);
      if (fixed.ok) {
        categories.slugMismatch.push(`${item.name}: ${item.slug} -> ${apostropheFix}`);
        await new Promise((r) => setTimeout(r, 800));
        continue;
      }
    }

    // Check if card page exists (commander not played on EDHREC)
    const cardUrl = `https://json.edhrec.com/pages/cards/${encodeURIComponent(item.slug)}.json`;
    const cardRes = await fetch(cardUrl, {
      headers: { Accept: "application/json", "User-Agent": USER_AGENT },
    });

    if (ourResult.status === 403 && cardRes.status === 200) {
      categories.noCommanderPage.push(`${item.name} (${item.slug})`);
    } else if (ourResult.status === 403) {
      categories.rateLimited.push(`${item.slug} HTTP 403`);
    } else {
      categories.other.push(`${item.slug} HTTP ${ourResult.status}`);
    }

    await new Promise((r) => setTimeout(r, 800));
  }

  console.log("\n=== Failure categories ===");
  console.log(`Slug mismatch (fixable): ${categories.slugMismatch.length}`);
  categories.slugMismatch.slice(0, 10).forEach((l) => console.log(" ", l));
  console.log(`No EDHREC commander page (card page only): ${categories.noCommanderPage.length}`);
  categories.noCommanderPage.slice(0, 10).forEach((l) => console.log(" ", l));
  console.log(`HTTP 403 (other): ${categories.rateLimited.length}`);
  categories.rateLimited.slice(0, 5).forEach((l) => console.log(" ", l));
  console.log(`Other: ${categories.other.length}`);
  categories.other.forEach((l) => console.log(" ", l));

  const bySource = {
    top: missing.filter((m) => m.source === "edhrec-top").length,
    local: missing.filter((m) => m.source === "local-catalog").length,
  };
  console.log("\nMissing by discovery source:", bySource);

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
