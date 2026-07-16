import { ArrowDown, ArrowUp } from "lucide-react";

import { Button } from "@/components/ui/button";
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
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={() => onChange(nextOrder)}
      aria-label={`${label} — switch to ${isAsc ? "descending" : "ascending"}`}
      title={label}
      className={cn("shrink-0 text-muted-foreground", className)}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden />
      <span className="sr-only">{label}</span>
    </Button>
  );
}
