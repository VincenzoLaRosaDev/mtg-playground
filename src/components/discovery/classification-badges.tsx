import type { ReactNode } from "react";

import type { CardClassificationSummary } from "@/lib/discovery/detail-pack";
import { CONTENT_REVEAL_CLASS } from "@/lib/ui/layout";
import { cn } from "@/lib/utils";

type ClassificationBadgesProps = {
  classification: CardClassificationSummary | null;
  /** When set, Status sits in the same responsive row as Roles / Themes. */
  status?: ReactNode;
  /**
   * Breakpoint where Status | Roles | Themes share a row.
   * Default `lg` matches bottom-sheet → dialog (and keeps a stacked column on tablets).
   */
  rowFrom?: "sm" | "lg";
};

function BadgeList({ label, values }: { label: string; values: string[] }) {
  if (values.length === 0) return null;
  return (
    <div className="min-w-0">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <ul className="mt-2 flex flex-wrap gap-2">
        {values.map((value) => (
          <li
            key={value}
            className="rounded-md border border-border bg-background px-2.5 py-1 text-sm capitalize"
          >
            {value.replaceAll("_", " ")}
          </li>
        ))}
      </ul>
    </div>
  );
}

function lastItemColSpanClass(
  itemCount: number,
  rowFrom: "sm" | "lg",
): string | null {
  // Fixed 3-col track: missing sections → last block absorbs leftover columns.
  if (itemCount === 1) {
    return rowFrom === "lg" ? "lg:col-span-3" : "sm:col-span-3";
  }
  if (itemCount === 2) {
    return rowFrom === "lg" ? "lg:col-span-2" : "sm:col-span-2";
  }
  return null;
}

/**
 * Roles / themes (and optional Status) in the overview panel.
 * Mobile-first: stack; from `rowFrom` share a fixed 3-col track (same as Printing).
 * When a section is missing, the last visible block spans the leftover columns
 * (2 items → 1+2; 1 item → full width) instead of leaving an empty column.
 */
export function ClassificationBadges({
  classification,
  status,
  rowFrom = "lg",
}: ClassificationBadgesProps) {
  const roles = classification?.roles ?? [];
  const themes = classification?.themes ?? [];

  const items: { key: string; node: ReactNode }[] = [];
  if (status) items.push({ key: "status", node: status });
  if (roles.length > 0) {
    items.push({ key: "roles", node: <BadgeList label="Roles" values={roles} /> });
  }
  if (themes.length > 0) {
    items.push({
      key: "themes",
      node: <BadgeList label="Themes" values={themes} />,
    });
  }

  if (items.length === 0) return null;

  const itemCount = items.length;
  const lastSpanClass = lastItemColSpanClass(itemCount, rowFrom);

  return (
    <div
      className={cn(
        CONTENT_REVEAL_CLASS,
        "grid grid-cols-1 gap-4",
        rowFrom === "lg" ? "lg:grid-cols-3 lg:gap-6" : "sm:grid-cols-3 sm:gap-6",
      )}
    >
      {items.map((item, index) => {
        const isLast = index === itemCount - 1;
        return (
          <div
            key={item.key}
            className={cn("min-w-0", isLast && lastSpanClass)}
          >
            {item.node}
          </div>
        );
      })}
    </div>
  );
}
