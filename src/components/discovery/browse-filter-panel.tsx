import type { ReactNode } from "react";

import { BrowseSortOrderToggle } from "@/components/discovery/browse-sort-order-toggle";
import { browseToolbarPanelClassName } from "@/components/discovery/browse-toolbar-shared";
import { useListFilterDrawer } from "@/components/layout/list-filter-drawer-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { BrowseOrder } from "@/lib/browse/types";
import { cn } from "@/lib/utils";

type BrowseFilterPanelProps = {
  children: ReactNode;
  className?: string;
};

export function BrowseFilterPanel({ children, className }: BrowseFilterPanelProps) {
  const inDrawer = useListFilterDrawer();

  // Drawer supplies square chrome — skip Card rounded-xl / ring.
  // Keep CardContent horizontal padding (px-3) so fields align with the in-page panel.
  if (inDrawer) {
    return (
      <div className={cn(browseToolbarPanelClassName, "px-3", className)}>
        {children}
      </div>
    );
  }

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
    <div
      className={cn(
        "flex flex-col items-stretch gap-3 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0 flex-1">{children}</div>
      {showActions ? (
        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-border pt-3 sm:border-t-0 sm:pt-0">
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
