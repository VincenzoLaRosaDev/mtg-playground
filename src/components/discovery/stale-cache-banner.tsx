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
    <div className="rounded-lg border border-violet-300 bg-violet-50 px-4 py-3 text-sm text-violet-950 dark:border-violet-800 dark:bg-violet-950/40 dark:text-violet-100">
      {message}
    </div>
  );
}
