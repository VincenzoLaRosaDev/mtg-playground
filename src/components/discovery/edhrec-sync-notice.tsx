import { getEdhrecSyncHealth } from "@/lib/edhrec/sync-status";

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export async function EdhrecSyncNotice() {
  const health = await getEdhrecSyncHealth();

  if (!health.showNotice) {
    return null;
  }

  const detail = health.hasRecentFailure
    ? "The latest EDHREC sync did not complete successfully."
    : "EDHREC rankings and card stats may be outdated.";

  return (
    <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200">
      {detail}
      {health.lastSuccessAt
        ? ` Last successful sync: ${formatDate(health.lastSuccessAt)}.`
        : " No successful EDHREC sync recorded yet."}
    </div>
  );
}
