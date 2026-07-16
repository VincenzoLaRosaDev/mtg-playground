import { isCatalogDebugEnabled } from "@/lib/dev/catalog-debug";

const DEV_COVERAGE_BADGE_CLASSNAME =
  "rounded-full border border-info/40 bg-info/15 px-2 py-0.5 text-xs text-info-foreground";

type DevEdhrecCoverageBadgeProps = {
  label: "No EDHREC data" | "No EDHREC meta";
};

export function DevEdhrecCoverageBadge({ label }: DevEdhrecCoverageBadgeProps) {
  if (!isCatalogDebugEnabled()) {
    return null;
  }

  return <span className={DEV_COVERAGE_BADGE_CLASSNAME}>{label}</span>;
}
