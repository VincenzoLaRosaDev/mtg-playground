import { Alert, AlertDescription } from "@/components/ui/alert";
import { isCatalogDebugEnabled } from "@/lib/dev/catalog-debug";

type StaleCacheBannerProps = {
  syncedAt: Date;
  context?: "page" | "global";
};

export function StaleCacheBanner({ syncedAt, context = "page" }: StaleCacheBannerProps) {
  if (!isCatalogDebugEnabled()) {
    return null;
  }

  const formatted = syncedAt.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const message =
    context === "page"
      ? `Dev: could not refresh popularity overlay for this page. Showing cache from ${formatted}.`
      : `Dev: popularity overlay may be outdated. Last updated: ${formatted}.`;

  return (
    <Alert variant="info">
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}
