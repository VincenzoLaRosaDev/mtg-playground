import type { ReactNode } from "react";

import { BrowseSortOrderToggle } from "@/components/discovery/browse-sort-order-toggle";
import { browseToolbarPanelClassName } from "@/components/discovery/browse-toolbar-shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { BrowseOrder } from "@/lib/browse/types";
import { cn } from "@/lib/utils";

type BrowseFilterPanelProps = {
  children: ReactNode;
  className?: string;
};

export function BrowseFilterPanel({ children, className }: BrowseFilterPanelProps) {
  return (
    <Card size="sm" className={cn("shadow-sm", className)}>
      <CardContent className={cn(browseToolbarPanelClassName, "px-3 pt-1")}>{children}</CardContent>
    </Card>
  );
}

type BrowseFilterPanelRowProps = {
  children: ReactNode;
  className?: string;
  sortOrder?: {
    order: BrowseOrder;
    onChange: (order: BrowseOrder) => void;
  };
  /** Shown immediately left of the sort-order toggle when filters are active. */
  clearFilters?: {
    visible: boolean;
    onClear: () => void;
  };
};

/** Last (or any) panel row — optional clear + sort-order controls flush right. */
export function BrowseFilterPanelRow({
  children,
  className,
  sortOrder,
  clearFilters,
}: BrowseFilterPanelRowProps) {
  const showClear = Boolean(clearFilters?.visible);
  const showActions = showClear || Boolean(sortOrder);

  return (
    <div className={cn("flex items-end justify-between gap-3", className)}>
      <div className="min-w-0 flex-1">{children}</div>
      {showActions ? (
        <div className="flex shrink-0 items-center gap-2">
          {showClear && clearFilters ? (
            <Button
              type="button"
              variant="outline"
              size="default"
              className="text-muted-foreground"
              onClick={clearFilters.onClear}
            >
              Clear filters
            </Button>
          ) : null}
          {sortOrder ? (
            <BrowseSortOrderToggle order={sortOrder.order} onChange={sortOrder.onChange} />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
