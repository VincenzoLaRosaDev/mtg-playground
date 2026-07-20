import { NextResponse } from "next/server";

import { SyncSource, SyncStatus } from "@/generated/prisma/client";
import { isCatalogDebugEnabled } from "@/lib/dev/catalog-debug";
import { prisma } from "@/lib/db";

export async function GET() {
  if (!isCatalogDebugEnabled()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const lastSuccess = await prisma.syncLog.findFirst({
    where: {
      source: SyncSource.SCRYFALL,
      jobType: "oracle_cards_full",
      status: SyncStatus.SUCCESS,
    },
    orderBy: { completedAt: "desc" },
    select: { completedAt: true },
  });

  const lastFailure = await prisma.syncLog.findFirst({
    where: {
      source: SyncSource.SCRYFALL,
      status: SyncStatus.FAILED,
    },
    orderBy: { startedAt: "desc" },
    select: { startedAt: true, completedAt: true },
  });

  const lastSuccessAt = lastSuccess?.completedAt ?? null;
  const recentFailure =
    lastFailure != null &&
    (lastSuccessAt == null ||
      (lastFailure.completedAt ?? lastFailure.startedAt) > lastSuccessAt);

  return NextResponse.json({
    syncStatus: recentFailure ? "Recent failure" : lastSuccessAt ? "OK" : "Never synced",
    lastSuccessAt: lastSuccessAt?.toISOString() ?? null,
  });
}
