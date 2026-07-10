import { CatalogDebugPanel } from "@/components/dev/catalog-debug-panel";
import { getEdhrecSyncHealth } from "@/lib/edhrec/sync-status";
import { isCatalogDebugEnabled } from "@/lib/dev/catalog-debug";

function formatDate(date: Date): string {
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export async function CatalogDebugBadge() {
  if (!isCatalogDebugEnabled()) {
    return null;
  }

  const health = await getEdhrecSyncHealth();
  const syncStatus = health.hasRecentFailure
    ? "Recent failure"
    : health.isStale
      ? "Stale"
      : "OK";

  return (
    <CatalogDebugPanel
      syncStatus={syncStatus}
      lastSuccessLabel={health.lastSuccessAt ? formatDate(health.lastSuccessAt) : "Never"}
    />
  );
}
