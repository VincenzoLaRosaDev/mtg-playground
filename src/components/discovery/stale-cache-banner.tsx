type StaleCacheBannerProps = {
  syncedAt: Date;
  context?: "page" | "global";
};

export function StaleCacheBanner({ syncedAt, context = "page" }: StaleCacheBannerProps) {
  const formatted = syncedAt.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const message =
    context === "page"
      ? `Could not refresh EDHREC data for this page. Showing cached data from ${formatted}.`
      : `EDHREC data may be outdated. Last updated: ${formatted}.`;

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200">
      {message}
    </div>
  );
}
