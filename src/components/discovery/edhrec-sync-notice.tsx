import { Alert, AlertDescription } from "@/components/ui/alert";
import { getEdhrecSyncHealth } from "@/lib/edhrec/sync-status";
import { siteContainerClassName } from "@/lib/ui/layout";
import { cn } from "@/lib/utils";

/**
 * Browse-level notice when weekly popularity sync failed or is older than 8 days.
 * Production copy stays neutral (“Popularity data”); component name matches docs.
 */
export async function EdhrecSyncNotice() {
  const health = await getEdhrecSyncHealth();

  if (!health.showNotice) {
    return null;
  }

  const lastSynced = health.lastSuccessAt
    ? health.lastSuccessAt.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null;

  const lead = health.hasRecentFailure
    ? "A recent popularity data sync failed."
    : "Popularity rankings may be out of date.";

  const detail = lastSynced
    ? `Last successful sync: ${lastSynced}. Showing the last cached lists.`
    : "No recent successful sync recorded. Showing the last cached lists.";

  return (
    <div className={cn(siteContainerClassName, "pt-6")}>
      <Alert role="status" className="bg-muted/50 text-muted-foreground">
        <AlertDescription>
          {lead} {detail}
        </AlertDescription>
      </Alert>
    </div>
  );
}
