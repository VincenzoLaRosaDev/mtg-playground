import { isCatalogDebugEnabled } from "@/lib/dev/catalog-debug";

const DEV_COVERAGE_BADGE_CLASSNAME =
  "rounded-full border border-violet-300 bg-violet-50 px-2 py-0.5 text-xs text-violet-800 dark:border-violet-700 dark:bg-violet-950/40 dark:text-violet-200";

type DevEdhrecCoverageBadgeProps = {
  label: "No EDHREC data" | "No EDHREC meta";
};

export function DevEdhrecCoverageBadge({ label }: DevEdhrecCoverageBadgeProps) {
  if (!isCatalogDebugEnabled()) {
    return null;
  }

  return <span className={DEV_COVERAGE_BADGE_CLASSNAME}>{label}</span>;
}
