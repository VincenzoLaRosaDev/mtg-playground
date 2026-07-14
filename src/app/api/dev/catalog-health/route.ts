import { NextResponse } from "next/server";

import { isCatalogDebugEnabled } from "@/lib/dev/catalog-debug";
import { getEdhrecSyncHealth } from "@/lib/edhrec/sync-status";

export async function GET() {
  if (!isCatalogDebugEnabled()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const health = await getEdhrecSyncHealth();

  return NextResponse.json({
    syncStatus: health.hasRecentFailure
      ? "Recent failure"
      : health.isStale
        ? "Stale"
        : "OK",
    lastSuccessAt: health.lastSuccessAt?.toISOString() ?? null,
  });
}
