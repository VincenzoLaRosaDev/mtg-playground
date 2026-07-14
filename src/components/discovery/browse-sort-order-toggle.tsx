import { ArrowDown, ArrowUp } from "lucide-react";

import type { BrowseOrder } from "@/lib/browse/types";
import { cn } from "@/lib/utils";

type BrowseSortOrderToggleProps = {
  order: BrowseOrder;
  onChange: (order: BrowseOrder) => void;
  className?: string;
};

export function BrowseSortOrderToggle({
  order,
  onChange,
  className,
}: BrowseSortOrderToggleProps) {
  const isAsc = order === "asc";
  const nextOrder: BrowseOrder = isAsc ? "desc" : "asc";
  const label = isAsc ? "Ascending" : "Descending";
  const Icon = isAsc ? ArrowUp : ArrowDown;

  return (
    <button
      type="button"
      onClick={() => onChange(nextOrder)}
      aria-label={`${label} — switch to ${isAsc ? "descending" : "ascending"}`}
      title={label}
      className={cn(
        "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-input bg-background text-muted-foreground shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30",
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden />
      <span className="sr-only">{label}</span>
    </button>
  );
}
